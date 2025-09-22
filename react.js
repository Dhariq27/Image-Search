// ===== Pixabay API Config =====
const API_KEY = "52395454-0259d1d10ab488aa9ec1e33d1"; 
const BASE_URL = "https://pixabay.com/api/";

let currentPage = 1;
let currentQuery = "";

// ===== DOM Elements =====
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const imageResults = document.getElementById("imageResults");
const darkModeToggle = document.getElementById("darkModeToggle"); // FIXED

const loading = document.getElementById("loading");
const message = document.getElementById("message");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const suggestionsDiv = document.getElementById("suggestions");

// ===== Fetch Images =====
async function fetchImages(query, page = 1) {
    showLoading(true);
    message.textContent = "";

    try {
        const response = await fetch(
            `${BASE_URL}?key=${API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&pretty=true&per_page=12&page=${page}`
        );
        const data = await response.json();

        if (page === 1) imageResults.innerHTML = "";

        if (data.hits.length === 0) {
            message.textContent = "🚫 No results found. Try another search!";
            loadMoreBtn.style.display = "none";
        } else {
            renderImages(data.hits);
            loadMoreBtn.style.display = data.totalHits > page * 12 ? "block" : "none";
        }
    } catch (error) {
        message.textContent = "⚠️ Error fetching images. Please try again!";
    }

    showLoading(false);
}

// ===== Render Images in Cards =====
function renderImages(images) {
    images.forEach(img => {
        const card = document.createElement("div");
        card.classList.add("image-card");
        card.style.animationDelay = `${imageResults.childElementCount * 0.10}s`;

        // Initialize localStorage counts if not present
        if (!localStorage.getItem(`img_${img.id}_views`)) localStorage.setItem(`img_${img.id}_views`, 0);
        if (!localStorage.getItem(`img_${img.id}_likes`)) localStorage.setItem(`img_${img.id}_likes`, 0);
        if (!localStorage.getItem(`img_${img.id}_downloads`)) localStorage.setItem(`img_${img.id}_downloads`, 0);

        const views = localStorage.getItem(`img_${img.id}_views`);
        const likes = localStorage.getItem(`img_${img.id}_likes`);
        const downloads = localStorage.getItem(`img_${img.id}_downloads`);

        card.innerHTML = `
            <img src="${img.webformatURL}" alt="${img.tags}">
            <div class="image-info">
                <p><strong>📷 ${img.user}</strong></p>
                <p>❤️ <span class="likes-count">${likes}</span> | 👁️ <span class="views-count">${views}</span> | ⬇️ <span class="downloads-count">${downloads}</span></p>
                <div style="margin-top:5px;">
                    <button class="like-btn">👍 Like</button>
                    <button class="download-btn">⬇️ Download</button>
                </div>
                <a href="${img.pageURL}" target="_blank">🔗 View Original</a>
            </div>
        `;

        imageResults.appendChild(card);

        // ===== Increment Views when image is clicked =====
        card.querySelector('img').addEventListener('click', () => {
            let currentViews = parseInt(localStorage.getItem(`img_${img.id}_views`));
            currentViews++;
            localStorage.setItem(`img_${img.id}_views`, currentViews);
            card.querySelector('.views-count').textContent = currentViews;
            // Open original image
            window.open(img.pageURL, "_blank");
        });

        // ===== Like button =====
        card.querySelector('.like-btn').addEventListener('click', () => {
            let currentLikes = parseInt(localStorage.getItem(`img_${img.id}_likes`));
            currentLikes++;
            localStorage.setItem(`img_${img.id}_likes`, currentLikes);
            card.querySelector('.likes-count').textContent = currentLikes;
        });

        // ===== Download button =====
        card.querySelector('.download-btn').addEventListener('click', () => {
        // Increment downloads counter
        let currentDownloads = parseInt(localStorage.getItem(`img_${img.id}_downloads`));
        currentDownloads++;
        localStorage.setItem(`img_${img.id}_downloads`, currentDownloads);
        card.querySelector('.downloads-count').textContent = currentDownloads;
        // Trigger actual download
        const link = document.createElement('a');
        link.href = img.webformatURL;          // Pixabay image URL
        link.download = `${img.tags}.jpg`;     // Filename to save
        document.body.appendChild(link);       // Append to DOM
        link.click();                          // Trigger click to download
        document.body.removeChild(link);       // Remove link
        });

    });
}


// ===== Show/Hide Loading =====
function showLoading(isLoading) {
    loading.style.display = isLoading ? "block" : "none";
}

// ===== Event Listeners =====
searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) {
        currentQuery = query;
        currentPage = 1;
        fetchImages(currentQuery, currentPage);
    }
});

loadMoreBtn.addEventListener("click", () => {
    currentPage++;
    fetchImages(currentQuery, currentPage);
});

// ===== Dark Mode Toggle =====
darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    darkModeToggle.textContent = 
        document.body.classList.contains("dark-mode") ? "☀️ Light Mode" : "🌙 Dark Mode";
});

// ===== Dynamic Suggestions =====
searchInput.addEventListener("input", async () => {
    const query = searchInput.value.toLowerCase().trim();
    suggestionsDiv.innerHTML = "";

    if (!query) {
        suggestionsDiv.style.display = "none";
        return;
    }

    try {
        const response = await fetch(
            `${BASE_URL}?key=${API_KEY}&q=${encodeURIComponent(query)}&per_page=20`
        );
        const data = await response.json();

        const uniqueSuggestions = [...new Set(
            data.hits
                .flatMap(item => item.tags.split(","))
                .map(tag => tag.trim())
                .filter(tag => tag.toLowerCase().startsWith(query))
        )].slice(0, 4);

        if (uniqueSuggestions.length > 0) {
            uniqueSuggestions.forEach(word => {
                const div = document.createElement("div");
                div.textContent = word;
                div.classList.add("suggestion-item");
                div.addEventListener("click", () => {
                    searchInput.value = word;
                    suggestionsDiv.style.display = "none";
                    currentQuery = word;
                    currentPage = 1;
                    fetchImages(currentQuery, currentPage);
                });
                suggestionsDiv.appendChild(div);
            });
            suggestionsDiv.style.display = "block";
        } else {
            suggestionsDiv.style.display = "none";
        }
    } catch (error) {
        console.error("Suggestion error:", error);
        suggestionsDiv.style.display = "none";
    }
});
