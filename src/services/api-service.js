// src/services/api-service.js

export class RateLimitError extends Error {
    constructor(message) {
      super(message);
      this.name = 'RateLimitError';
    }
  }
// ... (fetchKeywordListings function remains the same)
export async function fetchKeywordListings(keyword, quantity) {
    const encodedKeyword = encodeURIComponent(keyword);
    const url = `https://www.vinted.pl/api/v2/catalog/items?search_text=${encodedKeyword}&per_page=${quantity}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "accept": "application/json, text/plain, */*",
          "cache-control": "no-cache",
          "pragma": "no-cache",
        },
        mode: "cors",
      });
      if (!response.ok) {
        console.error(`API request failed with status: ${response.status}`);
        return null;
      }
      const data = await response.json();
      if (!data || !data.items) {
        console.log("No items found in the API response.");
        return [];
      }
      const listings = data.items.map(item => ({
        id: item.id,
        title: item.title,
        user: {
            id: item.user.id,
            name: item.user.login,
            thumbnail_url: item.user.photo?.thumbnails[1].url || null
        },
        thumbnail_url: item.photo?.thumbnails[1]?.url || null
      }));
      return listings;
    } catch (error) {
      console.error("An error occurred while fetching Vinted listings:", error);
      return null;
    }
}


const LIKE_ITEM_URL = 'https://www.vinted.pl/api/v2/user_favourites/toggle';

/**
 * Toggles the 'like' (favourite) status for a specific item on Vinted.
 *
 * @param {number} itemId The unique identifier for the item to like.
 * @param {string} csrfToken The active CSRF token required for the request.
 * @returns {Promise<boolean>} TRUE on success, FALSE on failure.
 */
export async function likeItem(itemId, csrfToken) {
  if (!itemId || !csrfToken) {
    console.error('Invalid arguments: A numeric itemId and a csrfToken string are required.');
    return false; // Return explicit false
  }

  const requestBody = JSON.stringify({
    type: "item",
    user_favourites: [itemId]
  });

  try {
    const response = await fetch(LIKE_ITEM_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'content-type': 'application/json',
        'x-csrf-token': csrfToken
      },
      body: requestBody,
      credentials: 'include'
    });

    if (response.status === 429) {
        throw new RateLimitError('Too many requests on likeItem.');
    }

    // If response is NOT okay (e.g., 403, 404, 500), log and return false
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({})); // Try to get more error info
      console.error('Error details:', errorData);
      return false; // Return explicit false
    }

    // If we get here, the request was successful
    return true; // Return explicit true

  } catch (error) {
    if (error instanceof RateLimitError) {
        throw error;
    }
    // Handle network-level errors (e.g., user is offline)
    console.error('Network request failed:', error.message);
    return false; // Return explicit false
  }
}


/**
 * Fetches all items from a Vinted user's wardrobe.
 * @param {string|number} userId The ID of the Vinted user.
 * @returns {Promise<Array<{id: number, title: string, thumbnailUrl: string|null}>>} A promise that resolves with the list of items.
 */
export async function getVintedItemsByUserId(userId) {
    try {
      const userApiUrl = `https://www.vinted.pl/api/v2/users/${userId}`;
      const userResponse = await fetch(userApiUrl);
      if (!userResponse.ok) throw new Error(`Failed to fetch user data. Status: ${userResponse.status}`);
      
      const userData = await userResponse.json();
      const itemCount = userData?.user?.item_count;
      if (typeof itemCount !== 'number') throw new Error("Could not determine item count.");
      if (itemCount === 0) return [];

      const itemsPerPage = 90;
      const totalPages = Math.ceil(itemCount / itemsPerPage);
      const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

      const fetchPromises = pageNumbers.map(page => {
        const wardrobeApiUrl = `https://www.vinted.pl/api/v2/wardrobe/${userId}/items?page=${page}&per_page=${itemsPerPage}`;
        return fetch(wardrobeApiUrl).then(res => res.ok ? res.json() : Promise.reject(`Failed to fetch page ${page}.`));
      });

      const allPageResults = await Promise.all(fetchPromises);
      const allItems = allPageResults.flatMap(pageResult => pageResult.items || []);
      
      return allItems.map(item => ({
        id: item.id,
        title: item.title,
        thumbnailUrl: item.photos?.[0]?.thumbnails?.[2]?.url || null
      }));
    } catch (error) {
        if (error instanceof RateLimitError) {
            throw error;
        }

      console.error("❌ An error occurred while fetching user items:", error);
      return null; // Return null on error to be handled by the UI
    }
}


// Add this new function to your existing api-service.js file

/**
 * Follows or unfollows a Vinted user.
 * @param {number|string} userId The ID of the user to follow.
 * @param {string} csrfToken The active CSRF token for the request.
 * @returns {Promise<boolean>} TRUE on success, FALSE on failure.
 */
export async function followUser(userId, csrfToken) {
    const apiUrl = 'https://www.vinted.pl/api/v2/followed_users/toggle';
    const requestBody = JSON.stringify({ user_id: userId });

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/json',
                'x-csrf-token': csrfToken
            },
            body: requestBody,
            credentials: 'include'
        });

        if (response.status === 429) {
            throw new RateLimitError('Too many requests on followUser.');
        }

        if (!response.ok) {
            console.error(`Follow API Error: ${response.status}`);
            return false;
        }

        return true;

    } catch (error) {
        if (error instanceof RateLimitError) {
            throw error;
        }
        console.error('Failed to execute the follow request:', error);
        return false;
    }
}


/**
 * =================================================================================
 * Main Orchestration Function
 * =================================================================================
 * This function handles the entire workflow of reposting a Vinted item.
 * It fetches an existing item, uploads its images, creates a new draft,
 * publishes the draft, and finally deletes the original item.
 */

/**
 * Executes the complete Vinted item reposting workflow.
 *
 * @param {object} config - The configuration object for the workflow.
 * @param {number|string} config.initialPostId - The ID of the item to be reposted.
 * @param {string} config.csrfToken - The CSRF token for the authenticated session.
 * @param {string} config.domain - The Vinted domain (e.g., "www.vinted.pl").
 * @param {string} config.proxyUrl - The URL of the CORS proxy to fetch images.
 * @returns {Promise<object>} A promise that resolves with the final, successful API response from publishing the item.
 * @throws {Error} Throws an error if any step in the workflow fails.
 */
export async function repostItemWorkflow({ initialPostId, csrfToken, domain, proxyUrl, isStopRequested, onProgress }) {
    console.log(`🚀 Starting repost workflow for item ID: ${initialPostId}`);
    
    const checkStop = isStopRequested || (() => false);
    // Provide a default empty function for onProgress to prevent errors if it's not passed.
    const reportProgress = onProgress || (() => {});
    const tempUuid = crypto.randomUUID();

    try {
        // Step 1: Fetch initial post data
        const initialPostData = await _getDataPost(initialPostId, domain);
        reportProgress(1); // Report step 1 is complete
        if (checkStop()) throw new Error("Action stopped by user.");
        await _sleep();

        // Step 2: Upload images
        const newImageIds = await _uploadVintedImagesViaProxy(initialPostData, csrfToken, proxyUrl, domain, tempUuid);
        reportProgress(2);
        if (checkStop()) throw new Error("Action stopped by user.");
        await _sleep();

        // Step 3: Craft the draft body
        const draftBody = _createDraftBody(initialPostData, newImageIds, tempUuid);
        reportProgress(3);
        
        // Step 4: Create the draft
        const draftId = await _createVintedDraft(csrfToken, draftBody, domain);
        reportProgress(4);
        if (checkStop()) throw new Error("Action stopped by user.");
        await _sleep();

        // Step 5: Fetch new draft data
        const draftData = await _getDataPost(draftId, domain);
        reportProgress(5);
        if (checkStop()) throw new Error("Action stopped by user.");
        
        // Step 6: Craft the completion body
        const completionBody = _createCompletionBody(draftData, tempUuid);
        reportProgress(6);
        if (checkStop()) throw new Error("Action stopped by user.");
        await _sleep();
        
        // Step 7: Delete the initial item
        await _deleteVintedItem(csrfToken, initialPostId, domain);
        reportProgress(7);
        await _sleep();

        // Step 8: Publish the draft
        const finalResponse = await _publishVintedDraft(csrfToken, draftId, completionBody, domain);
        reportProgress(8);
        
        return finalResponse;

    } catch (error) {
        throw error;
    }
}


/**
 * =================================================================================
 * Helper Functions (Internal Implementation)
 * =================================================================================
 */

function _sleep() {
    const ms = Math.floor(Math.random() * 1000) + 200;
    console.log(`   ...sleeping for ${ms}ms...`);
    return new Promise(resolve => setTimeout(resolve, ms));
}

// From: 1,5 - getDataPost.js
async function _getDataPost(postId, domain) {
    const response = await fetch(`https://${domain}/api/v2/item_upload/items/${postId}`, {
        headers: {
            "accept": "application/json, text/plain, */*",
            "cache-control": "no-cache",
            "pragma": "no-cache"
        },
        method: "GET",
        mode: "cors",
        credentials: "include"
    });

    if (response.status === 429) {
        throw new RateLimitError('Too many requests on getPost.');
    }

    if (!response.ok) {
        throw new Error(`Failed to get post data for ID ${postId}. Status: ${response.status}`);
    }
    return response.json();
}

// From: 2 - uploadImages.js
async function _uploadVintedImagesViaProxy(postData, csrfToken, proxyUrl, domain, tempUuid) {
    if (!proxyUrl || !proxyUrl.startsWith('http')) {
        throw new Error(`Invalid proxyUrl provided: "${proxyUrl}". It must be a valid http/https URL pointing to your CORS proxy server.`);
    }

    const imageUrls = (postData?.item?.photos || []).map(p => p.full_size_url).filter(Boolean);
    if (imageUrls.length === 0) {
        console.warn("No images found in the post data to upload.");
        return [];
    }
    const newImageIds = [];
    const uploadUrl = `https://${domain}/api/v2/photoss`;

    try {

        for (const originalUrl of imageUrls) {
            try {
                const proxyFetchUrl = `${proxyUrl}${originalUrl}`;
                
                console.log(`   [Debug] Fetching image via proxy: ${proxyFetchUrl}`);
                const imageResponse = await fetch(proxyFetchUrl);
                if (!imageResponse.ok) throw new Error(`Proxy fetch failed for ${originalUrl} with status ${imageResponse.status}`);
                
                const blob = await imageResponse.blob();
                if (blob.size === 0) throw new Error("Fetched blob is empty.");

                const formData = new FormData();
                formData.append('photo[type]', 'item');
                formData.append('photo[file]', blob, 'image.jpeg');
                formData.append('photo[temp_uuid]', tempUuid);

                const vintedResponse = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { 
                        "x-csrf-token": csrfToken, 
                        "accept": "application/json, text/plain, */*"
                    },
                    body: formData,
                    mode: "cors",
                    credentials: "include"
                });

                if (!vintedResponse.ok) {
                    const errorText = await vintedResponse.text();
                    throw new Error(`Vinted API upload error. Status: ${vintedResponse.status}. Details: ${errorText}`);
                }

                const result = await vintedResponse.json();
                newImageIds.push(result.id);
                console.log(`   ✅ Successfully uploaded image, new ID: ${result.id}`);
                await _sleep(); 
            } catch (error) {
                if (error instanceof RateLimitError) {
                    throw error;
                }
                console.error(`Could not process image ${originalUrl}:`, error.message);
                continue;
            }
        }
    return newImageIds;
    } catch (error) {
        console.error("Image upload process failed:", error.message);
        // Re-throw the error to ensure the entire repostItemWorkflow stops.
        throw error;
    }
}

// --- Start of Edit ---
// Updated body creation functions based on your provided logic.

/**
 * Creates a base object with common item properties.
 * @param {object} item - The item object from the API response.
 * @returns {object} A base body object with shared properties.
 */
const _createBaseBody = (item) => {
  const color_ids = [item.color1_id, item.color2_id].filter(id => id !== null);

  return {
    title: item.title,
    size_id: item.size_id,
    catalog_id: item.catalog_id,
    is_unisex: !!item.is_unisex,
    package_size_id: item.package_size_id,
    shipment_prices: {
      domestic: item.domestic_shipment_price,
      international: item.international_shipment_price,
    },
    brand_id: item.brand_id,
    status_id: item.status_id,
    description: item.description,
    currency: item.currency,
    price: Number(item.price.amount),
    isbn: item.isbn,
    measurement_width: item.measurement_width,
    measurement_length: item.measurement_length,
    model: item.model,
    video_game_rating_id: item.video_game_rating_id,
    item_attributes: item.item_attributes,
    manufacturer: item.manufacturer,
    manufacturer_labelling: item.manufacturer_labelling,
    brand: item.brand_dto.title,
    color_ids: color_ids,
  };
};

/**
 * Creates the request body for a new draft item.
 * @param {object} sourceResponse - The source API response object.
 * @param {Array<number>} newPhotoIds - An array of new photo IDs to be assigned.
 * @param {string} uuid - A temporary unique identifier for the draft.
 * @returns {object} The complete request body for creating a draft.
 */
const _createDraftBody = (sourceResponse, newPhotoIds, uuid) => {
  const item = sourceResponse.item;
  const baseBody = _createBaseBody(item);
  const assigned_photos = newPhotoIds.map(id => ({ id: id, orientation: 0 }));

  const draft = {
    id: null,
    ...baseBody,
    assigned_photos: assigned_photos,
    temp_uuid: uuid,
  };

  return {
    draft: draft,
    feedback_id: null,
  };
};

/**
 * Creates the request body for completing or updating an item.
 * @param {object} response - The API response object for the item to complete.
 * @param {string} uuid - A temporary unique identifier.
 * @returns {object} The complete request body for completing an item.
 */
const _createCompletionBody = (response, uuid) => {
  const item = response.item;
  const baseBody = _createBaseBody(item);
  const assigned_photos = item.photos.map(photo => ({ id: photo.id, orientation: 0 }));
  
  const draft = {
    id: item.id,
    ...baseBody,
    assigned_photos: assigned_photos,
    temp_uuid: uuid,
  };

  return {
    draft: draft,
  };
};
// --- End of Edit ---

// From: 4 - doDraft.js
async function _createVintedDraft(csrf_token, body, domain) {
    const response = await fetch(`https://${domain}/api/v2/item_upload/drafts`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-csrf-token': csrf_token,
            'accept': 'application/json',
        },
        body: JSON.stringify(body),
        mode: 'cors',
        credentials: 'include',
    });

    if (response.status === 429) {
        throw new RateLimitError('Too many requests on createDraft.');
    }

    if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`API Error creating draft: ${response.status}. Details: ${errorDetails}`);
    }

    const data = await response.json();
    if (data?.draft?.id) {
        return data.draft.id;
    }
    throw new Error('API response did not contain a valid draft ID.');
}

// From: 8 - completeDraft.js
async function _publishVintedDraft(csrf_token, postId, body, domain) {
    if (!postId) throw new Error("A valid Post ID is required to publish a draft.");
    const response = await fetch(`https://${domain}/api/v2/item_upload/drafts/${postId}/completion`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-csrf-token': csrf_token,
            'accept': 'application/json',
        },
        body: JSON.stringify(body),
        mode: 'cors',
        credentials: 'include',
    });

    if (response.status === 429) {
        throw new RateLimitError('Too many requests on publishDraft.');
    }

    if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`API Error publishing draft: ${response.status}. Details: ${errorDetails}`);
    }
    return response.json();
}

// From: 7 - delete.js
async function _deleteVintedItem(csrf_token, itemId, domain) {
    if (!itemId) throw new Error("An Item ID is required to delete an item.");
    const response = await fetch(`https://${domain}/api/v2/items/${itemId}/delete`, {
        method: 'POST',
        headers: {
            'x-csrf-token': csrf_token,
            'accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
    });

    if (response.status === 429) {
        throw new RateLimitError('Too many requests on deleteItem.');
    }

    if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`API Error on item deletion: ${response.status}. Details: ${errorDetails}`);
    }
    return true;
}

/**
 * =================================================================================
 * Example Usage
 * =================================================================================
 */

// Example on how to run the main function.
// You would replace these placeholder values with actual data in your application.
/*
const config = {
    initialPostId: 123456789, // <-- The ID of the item you want to repost
    csrfToken: 'YOUR_CSRF_TOKEN_HERE', // <-- Your actual CSRF token
    domain: 'www.vinted.pl', // <-- The Vinted domain you are on
    proxyUrl: 'https://your-cors-proxy.com/' // <-- Your CORS proxy URL
};

repostItemWorkflow(config)
    .then(result => {
        console.log("✅ Final result from publishing:", result);
    })
    .catch(error => {
        console.error("🛑 The entire workflow failed:", error.message);
    });
*/

