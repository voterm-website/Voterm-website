const supabaseUrl = window.VOTREM_SUPABASE?.url;
const supabaseKey = window.VOTREM_SUPABASE?.anonKey;

if (!supabaseUrl || !supabaseKey) {
  alert("Supabase configuration is missing. Check config.js");
}

const supabaseClient = supabase.createClient(
  supabaseUrl,
  supabaseKey
);

const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const imageInput = document.getElementById("image");
const urlInput = document.getElementById("url");
const addButton = document.getElementById("add");
const list = document.getElementById("list");

async function loadUpdates() {
  const { data, error } = await supabaseClient
    .from("site_content")
    .select("*")
    .eq("id", "updates")
    .single();

  if (error && error.code !== "PGRST116") {
    console.error(error);
    return;
  }

  if (data && data.content && data.content.media) {
    render(data.content.media);
  }
}

function render(items) {
  list.innerHTML = "";

  items.forEach((item) => {
    const div = document.createElement("div");

    div.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.description || ""}</p>
      <img src="${item.image}" style="max-width:200px;">
      ${item.url ? `<p><a href="${item.url}" target="_blank">View Link</a></p>` : ""}
    `;

    list.appendChild(div);
  });
}

addButton.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const image = imageInput.value.trim();
  const url = urlInput.value.trim();

  if (!title || !image) {
    alert("Please enter both an Update title and Image URL.");
    return;
  }

  addButton.disabled = true;
  addButton.textContent = "Saving...";

  try {
    const { data: existing, error: fetchError } = await supabaseClient
      .from("site_content")
      .select("*")
      .eq("id", "updates")
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    let media = [];

    if (existing && existing.content && existing.content.media) {
      media = existing.content.media;
    }

    media.unshift({
      title: title,
      description: description,
      image: image,
      url: url
    });

    const { error: saveError } = await supabaseClient
      .from("site_content")
      .upsert({
        id: "updates",
        content: {
          media: media
        },
        updated_at: new Date().toISOString()
      });

    if (saveError) {
      throw saveError;
    }

    alert("Update saved successfully!");

    titleInput.value = "";
    descriptionInput.value = "";
    imageInput.value = "";
    urlInput.value = "";

    render(media);

  } catch (error) {
    console.error(error);
    alert("Error saving update: " + error.message);
  } finally {
    addButton.disabled = false;
    addButton.textContent = "Add Update";
  }
});

loadUpdates();
