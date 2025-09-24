// ===== API Keys =====
const PIXABAY_KEY = "52395454-0259d1d10ab488aa9ec1e33d1";
const PEXELS_KEY = "tuKz0EscJCp7WvvG7BqF1AbFfk3q6GceSKzXHoGBfHUCuT7nPZKYPTFn";
const GIPHY_KEY = "9kdp3qJixyCTGgMWoxH6wQnQZBMwOWn5";

// ===== Base URLs =====
const PIXABAY_URL = "https://pixabay.com/api/";
const PEXELS_URL = "https://api.pexels.com/videos/search";
const GIPHY_URL = "https://api.giphy.com/v1/gifs/search";

// ===== State =====
let currentPage = 1;
let currentQuery = "";
let currentAPI = "all";
let isSearching = false;

// ===== DOM Elements =====
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const apiSelector = document.getElementById("apiSelector");
const darkModeToggle = document.getElementById("darkModeToggle");
const imageResults = document.getElementById("imageResults");
const loading = document.getElementById("loading");
const suggestionsBox = document.getElementById("suggestions");
const loadMoreBtn = document.getElementById("loadMoreBtn");

// ===== Helper: Unique Views =====
function handleView(id, viewElement){
  const key = `viewed_${id}`;
  if(!localStorage.getItem(key)){
    let count = parseInt(viewElement.textContent) || 0;
    count++;
    viewElement.textContent = count;
    localStorage.setItem(key, "true");
  }
}

// ===== Fetch Functions =====
async function fetchPixabay(query, page=1){
  const res = await fetch(`${PIXABAY_URL}?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=8&page=${page}`);
  return res.json();
}
async function fetchPexels(query, page=1){
  const res = await fetch(`${PEXELS_URL}?query=${encodeURIComponent(query)}&per_page=4&page=${page}`, {headers:{Authorization:PEXELS_KEY}});
  return res.json();
}
async function fetchGiphy(query, page=0){
  const res = await fetch(`${GIPHY_URL}?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=8&offset=${page*8}`);
  return res.json();
}

// ===== Render Functions =====
function renderPixabay(images){
  images.forEach(img=>{
    const card = document.createElement("div");
    card.classList.add("image-card");
    const viewId = `views-${img.id}`;
    card.innerHTML = `
      <img src="${img.webformatURL}" alt="${img.tags}">
      <div class="image-info">
        <p>📷 ${img.user}</p>
        <p>${img.tags}</p>
        <p>👁️ <span id="${viewId}">0</span> views</p>
      </div>
      <div class="card-actions">
        <button onclick="downloadFile('${img.largeImageURL}')">⬇️ Download</button>
        <button onclick="toggleLike(this)">❤️ Like</button>
      </div>`;
    card.querySelector("img").addEventListener("click", ()=>{
      handleView(img.id, document.getElementById(viewId));
    });
    imageResults.appendChild(card);
  });
}

function renderPexels(videos){
  videos.forEach(video=>{
    const videoFile = video.video_files.find(v=>v.quality==='sd')||video.video_files[0];
    const card = document.createElement("div");
    card.classList.add("image-card");
    const viewId = `views-${video.id}`;
    card.innerHTML = `
      <video controls><source src="${videoFile.link}" type="video/mp4"></video>
      <div class="image-info">
        <p>🎬 ${video.user?.name||'Unknown'}</p>
        <p>Video</p>
        <p>👁️ <span id="${viewId}">0</span> views</p>
      </div>
      <div class="card-actions">
        <button onclick="downloadFile('${videoFile.link}')">⬇️ Download</button>
        <button onclick="toggleLike(this)">❤️ Like</button>
      </div>`;
    card.querySelector("video").addEventListener("play", ()=>{
      handleView(video.id, document.getElementById(viewId));
    });
    imageResults.appendChild(card);
  });
}

function renderGiphy(gifs){
  gifs.forEach(gif=>{
    const card = document.createElement("div");
    card.classList.add("image-card");
    const viewId = `views-${gif.id}`;
    card.innerHTML = `
      <img src="${gif.images.fixed_height.url}" alt="${gif.title}">
      <div class="image-info">
        <p>🎞️ ${gif.title}</p>
        <p>GIF</p>
        <p>👁️ <span id="${viewId}">0</span> views</p>
      </div>
      <div class="card-actions">
        <button onclick="downloadFile('${gif.images.original.url}')">⬇️ Download</button>
        <button onclick="toggleLike(this)">❤️ Like</button>
      </div>`;
    card.querySelector("img").addEventListener("click", ()=>{
      handleView(gif.id, document.getElementById(viewId));
    });
    imageResults.appendChild(card);
  });
}

// ===== Utility Functions =====
function downloadFile(url){
  fetch(url)
    .then(resp => resp.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
}

function toggleLike(btn){
  if(btn.textContent.includes('Like')){
    btn.textContent = '❤️ Unlike';
  } else {
    btn.textContent = '❤️ Like';
  }
}

// ===== Main Fetch =====
async function fetchResults(query, page=1){
  loading.style.display = 'block';
  if(page===1) imageResults.innerHTML='';
  try {
    if(currentAPI==='image'||currentAPI==='all'){
      const data = await fetchPixabay(query,page);
      renderPixabay(data.hits);
    }
    if(currentAPI==='video'||currentAPI==='all'){
      const data = await fetchPexels(query,page);
      renderPexels(data.videos);
    }
    if(currentAPI==='gif'||currentAPI==='all'){
      const data = await fetchGiphy(query,page-1);
      renderGiphy(data.data);
    }
    loadMoreBtn.style.display="block";
  } catch(err){ console.error(err); }
  loading.style.display = 'none';
}

// ===== Suggestions =====
searchInput.addEventListener("input", async ()=>{
  if(isSearching) return;
  const q = searchInput.value.trim();
  suggestionsBox.innerHTML='';
  if(!q) return;

  const [pixRes, pexRes, giphyRes] = await Promise.all([
    fetch(`${PIXABAY_URL}?key=${PIXABAY_KEY}&q=${encodeURIComponent(q)}&per_page=3`).then(r=>r.json()),
    fetch(`${PEXELS_URL}?query=${encodeURIComponent(q)}&per_page=3`,{headers:{Authorization:PEXELS_KEY}}).then(r=>r.json()),
    fetch(`${GIPHY_URL}?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=3`).then(r=>r.json())
  ]);

  const suggestions = [];
  pixRes.hits.forEach(i=>i.tags.split(',').forEach(tag=>{ if(tag.toLowerCase().startsWith(q.toLowerCase())) suggestions.push(tag); }));
  pexRes.videos.forEach(v=>{ if(v.user?.name?.toLowerCase().startsWith(q.toLowerCase())) suggestions.push(v.user.name); });
  giphyRes.data.forEach(g=>{ if(g.title.toLowerCase().startsWith(q.toLowerCase())) suggestions.push(g.title); });

  const final = Array.from(new Set(suggestions)).slice(0,8);
  final.forEach(s=>{
    const div = document.createElement('div');
    div.textContent = s;
    div.onclick = ()=>{
      searchInput.value = s;
      suggestionsBox.innerHTML='';
      searchBtn.click();
    };
    suggestionsBox.appendChild(div);
  });
});

// ===== Events =====
searchBtn.addEventListener("click", ()=>{
  const q = searchInput.value.trim();
  if(q){
    document.getElementById("aboutSection").style.display = "none";
    currentQuery = q;
    currentPage = 1;
    fetchResults(currentQuery,currentPage);
    suggestionsBox.innerHTML='';
  }
});

loadMoreBtn.addEventListener("click", ()=>{
  currentPage++;
  fetchResults(currentQuery,currentPage);
});

// ✅ Auto search on source change
apiSelector.addEventListener("change", ()=>{
  currentAPI = apiSelector.value;
  if(currentQuery.trim()){
    currentPage = 1;
    fetchResults(currentQuery, currentPage);
  }
});

// ===== Dark/Light Mode Toggle =====
darkModeToggle.addEventListener("click", ()=>{
  const body = document.body;
  const bg = document.querySelector('.background');
  if(body.classList.contains('dark-mode')){
    body.classList.remove('dark-mode'); body.classList.add('light-mode');
    darkModeToggle.textContent="🌙 Dark Mode";
    bg.style.background='linear-gradient(-45deg, #a18cd1, #fbc2eb, #fad0c4, #ffd1ff)';
  } else {
    body.classList.remove('light-mode'); body.classList.add('dark-mode');
    darkModeToggle.textContent="☀️ Light Mode";
    bg.style.background='linear-gradient(-45deg, #0f2027, #203a43, #2c5364, #1f1f1f)';
  }
});
