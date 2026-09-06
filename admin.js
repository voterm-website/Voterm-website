const supabaseUrl = window.VOTREM_SUPABASE.url;
const supabaseKey = window.VOTREM_SUPABASE.anonKey;

const client = supabase.createClient(
  supabaseUrl,
  supabaseKey
);


const loginBox = document.getElementById("loginBox");
const dashboard = document.getElementById("dashboard");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("login");
const logoutButton = document.getElementById("logout");

const loginStatus = document.getElementById("loginStatus");


const contentType = document.getElementById("contentType");

const titleInput = document.getElementById("title");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");

const dateInput = document.getElementById("date");
const locationInput = document.getElementById("location");

const imageInput = document.getElementById("image");
const urlInput = document.getElementById("url");

const addButton = document.getElementById("add");

const list = document.getElementById("list");



async function checkUser() {

  const {
    data: { session }
  } = await client.auth.getSession();

  if (session) {

    loginBox.classList.add("hidden");

    dashboard.classList.remove("hidden");

    loadContent();

  } else {

    loginBox.classList.remove("hidden");

    dashboard.classList.add("hidden");

  }

}



loginButton.addEventListener("click", async () => {

  const email = emailInput.value.trim();

  const password = passwordInput.value;


  if (!email || !password) {

    loginStatus.innerHTML =
      "<p>Please enter email and password.</p>";

    return;

  }


  loginButton.disabled = true;

  loginButton.textContent = "Logging in...";


  const { error } =
    await client.auth.signInWithPassword({

      email,
      password

    });


  loginButton.disabled = false;

  loginButton.textContent = "Login";


  if (error) {

    loginStatus.innerHTML =
      "<p>Login failed: " +
      escapeHtml(error.message) +
      "</p>";

    return;

  }


  loginStatus.innerHTML = "";

  passwordInput.value = "";

  checkUser();

});



logoutButton.addEventListener("click", async () => {

  await client.auth.signOut();

  checkUser();

});



async function loadContent() {

  list.innerHTML = "Loading...";


  const type = contentType.value;


  const { data, error } =
    await client
      .from("site_content")
      .select("*")
      .eq("id", type)
      .maybeSingle();


  if (error) {

    list.innerHTML =
      "<p>Error loading content.</p>";

    console.error(error);

    return;

  }


  const items =
    data?.content?.items || [];


  renderContent(items);

}



contentType.addEventListener(
  "change",
  loadContent
);



function renderContent(items) {

  list.innerHTML = "";


  if (!items.length) {

    list.innerHTML =
      "<p>No content published yet.</p>";

    return;

  }


  items.forEach((item, index) => {

    const div =
      document.createElement("div");


    div.className =
      "admin-item";


    div.innerHTML = `

      <strong>
        ${escapeHtml(item.title)}
      </strong>

      <p>
        ${escapeHtml(item.description || "")}
      </p>

      ${item.image
        ? `<img class="admin-image" src="${escapeHtml(item.image)}">`
        : ""
      }

      <br>

      <button data-index="${index}">
        Delete
      </button>

    `;


    const button =
      div.querySelector("button");


    button.addEventListener(
      "click",
      async () => {

        if (
          !confirm(
            "Delete this item?"
          )
        ) return;


        items.splice(
          index,
          1
        );


        await saveItems(
          items
        );


      }
    );


    list.appendChild(
      div
    );

  });

}



addButton.addEventListener(
  "click",
  async () => {


    const title =
      titleInput.value.trim();


    if (!title) {

      alert(
        "Please enter a title."
      );

      return;

    }


    addButton.disabled = true;

    addButton.textContent =
      "Publishing...";


    const type =
      contentType.value;


    const {
      data: existing
    } =
      await client
        .from("site_content")
        .select("*")
        .eq("id", type)
        .maybeSingle();


    const items =
      existing?.content?.items || [];


    items.unshift({

      title,

      category:
        categoryInput.value.trim(),

      description:
        descriptionInput.value.trim(),

      date:
        dateInput.value.trim(),

      location:
        locationInput.value.trim(),

      image:
        imageInput.value.trim(),

      url:
        urlInput.value.trim(),

      created_at:
        new Date().toISOString()

    });


    await saveItems(
      items
    );


    titleInput.value = "";

    categoryInput.value = "";

    descriptionInput.value = "";

    dateInput.value = "";

    locationInput.value = "";

    imageInput.value = "";

    urlInput.value = "";


    addButton.disabled =
      false;

    addButton.textContent =
      "Publish";


  }
);



async function saveItems(
  items
) {

  const type =
    contentType.value;


  const { error } =
    await client
      .from("site_content")
      .upsert({

        id: type,

        content: {
          items
        },

        updated_at:
          new Date()
            .toISOString()

      });


  if (error) {

    alert(
      "Error: " +
      error.message
    );

    console.error(
      error
    );

    return;

  }


  alert(
    "Saved successfully!"
  );


  loadContent();

}



document
  .getElementById(
    "loadPrayer"
  )
  .addEventListener(
    "click",
    loadPrayerRequests
  );



async function loadPrayerRequests() {

  const container =
    document.getElementById(
      "prayerList"
    );


  container.innerHTML =
    "Loading...";


  const {
    data,
    error
  } =
    await client
      .from(
        "prayer_requests"
      )
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    container.innerHTML =
      "<p>Unable to load requests.</p>";

    console.error(
      error
    );

    return;

  }


  container.innerHTML =
    "";


  data.forEach(
    item => {

      const div =
        document.createElement(
          "div"
        );


      div.className =
        "admin-item";


      div.innerHTML = `

        <strong>
          ${escapeHtml(item.name || "Anonymous")}
        </strong>

        <p>
          ${escapeHtml(item.category || "")}
        </p>

        <p>
          ${escapeHtml(item.request)}
        </p>

      `;


      container.appendChild(
        div
      );

    }
  );

}



document
  .getElementById(
    "loadMembership"
  )
  .addEventListener(
    "click",
    loadMembershipRequests
  );



async function loadMembershipRequests() {

  const container =
    document.getElementById(
      "membershipList"
    );


  container.innerHTML =
    "Loading...";


  const {
    data,
    error
  } =
    await client
      .from(
        "membership_requests"
      )
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    container.innerHTML =
      "<p>Unable to load requests.</p>";

    return;

  }


  container.innerHTML =
    "";


  data.forEach(
    item => {

      const div =
        document.createElement(
          "div"
        );


      div.className =
        "admin-item";


      div.innerHTML = `

        <strong>
          ${escapeHtml(item.name)}
        </strong>

        <p>
          ${escapeHtml(item.request_type)}
        </p>

        <p>
          ${escapeHtml(item.contact || "")}
        </p>

        <p>
          ${escapeHtml(item.message || "")}
        </p>

      `;


      container.appendChild(
        div
      );

    }
  );

}



function escapeHtml(
  text
) {

  return String(
    text || ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}



checkUser();
