const CONTENT_ID = "main";

// Get references to the Admin page elements
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const imageInput = document.getElementById("image");
const urlInput = document.getElementById("url");
const addButton = document.getElementById("add");
const list = document.getElementById("list");

// Load Supabase client
const supabase = window.supabase.createClient(
  window.VOTREM_SUPABASE.url,
  window.VOTREM_SUPABASE.anonKey
);

let data = {
  media: []
};


// Load content from Supabase
async function loadContent() {
  const { data: result, error } = await supabase
    .from("site_content")
    .select("*")
    .eq("id", CONTENT_ID)
    .maybeSingle();

  if (error) {
    console.error("Error loading content:", error);
    return;
  }

  if (result && result.content) {
    data = result.content;
  } else {
    data = {
      media: []
    };
  }

  render();
}


// Save content to Supabase
async function saveContent() {
  const { error } = await supabase
    .from("site_content")
    .upsert(
      {
        id: CONTENT_ID,
        content: data,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "id"
      }
    );

  if (error) {
    console.error("Error saving content:", error);
    alert("Could not save to Supabase: " + error.message);
    return false;
  }

  return true;
}


// Display all updates
function render() {
  list.innerHTML = "";

  if (!data.media || data.media.length === 0) {
    list.innerHTML = "<p>No updates yet.</p>";
    return;
  }

  data.media.forEach((item, index) => {
    const div = document.createElement("div");

    div.innerHTML = `
      <p><b>${escapeHtml(item.title)}</b></p>
      <p>${escapeHtml(item.description || "")}</p>
      <p>${escapeHtml(item.image || "")}</p>
      <button data-index="${index}">Remove</button>
    `;

    const button = div.querySelector("button");

    button.onclick = async () => {
      if (!confirm("Remove this update?")) return;

      data.media.splice(index, 1);

      const saved = await saveContent();

      if (saved) {
        render();
      }
    };

    list.appendChild(div);
  });
}


// Add a new update
addButton.onclick = async () => {
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const image = imageInput.value.trim();
  const url = urlInput.value.trim();

  if (!title || !image) {
    alert("Please enter both a title and an image URL.");
    return;
  }

  data.media.push({
    title,
    description,
    image,
    url
  });

  const saved = await saveContent();

  if (saved) {
    titleInput.value = "";
    descriptionInput.value = "";
    imageInput.value = "";
    urlInput.value = "";

    render();

    alert("Update saved successfully!");
  }
};


// Prevent HTML injection in displayed text
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// Start
loadContent();
