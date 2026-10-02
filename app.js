import { supabase } from "./supabase.js";


// ======================================================
// STATE
// ======================================================

let products = [];
let cart = JSON.parse(
  localStorage.getItem("maya_cart") || "[]"
);

let selectedCategory = null;


// ======================================================
// DOM
// ======================================================

const productsContainer =
  document.getElementById("products");

const cartDrawer =
  document.getElementById("cartDrawer");

const cartItems =
  document.getElementById("cartItems");

const cartTotal =
  document.getElementById("cartTotal");

const cartCount =
  document.getElementById("cartCount");

const overlay =
  document.getElementById("overlay");

const authModal =
  document.getElementById("authModal");

const authLoggedOut =
  document.getElementById("authLoggedOut");

const authLoggedIn =
  document.getElementById("authLoggedIn");

const userEmail =
  document.getElementById("userEmail");


// ======================================================
// HELPERS
// ======================================================

function formatPrice(price) {

  return new Intl.NumberFormat(
    "en-NG",
    {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }
  ).format(price);

}


function showToast(message) {

  const toast =
    document.getElementById("toast");

  toast.textContent = message;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);

}


function saveCart() {

  localStorage.setItem(
    "maya_cart",
    JSON.stringify(cart)
  );

}


// ======================================================
// PRODUCTS
// ======================================================

async function loadProducts() {

  productsContainer.innerHTML = `
    <div class="loading">
      Loading products...
    </div>
  `;

  const {
    data,
    error
  } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(error);

    productsContainer.innerHTML = `
      <div class="empty">
        <h3>Unable to load products</h3>
        <p>Check your Supabase settings.</p>
      </div>
    `;

    return;
  }

  products = data || [];

  renderProducts();

}


function renderProducts() {

  let list = [...products];

  if (selectedCategory) {

    list = list.filter(
      product =>
        product.category === selectedCategory
    );

  }

  const searchInput =
    document.getElementById("searchInput");

  const search =
    searchInput?.value
      ?.trim()
      .toLowerCase();

  if (search) {

    list = list.filter(product =>

      product.name
        .toLowerCase()
        .includes(search)

      ||

      product.description
        ?.toLowerCase()
        .includes(search)

      ||

      product.category
        ?.toLowerCase()
        .includes(search)

    );

  }


  if (!list.length) {

    productsContainer.innerHTML = `
      <div class="empty">
        <h3>No products found</h3>
        <p>Try another category or search.</p>
      </div>
    `;

    return;
  }


  productsContainer.innerHTML =
    list.map(product => `

      <article class="product-card">

        <div class="product-image">

          <img
            src="${product.image_url || "https://placehold.co/600x750?text=MAYA"}"
            alt="${escapeHtml(product.name)}"
          />

          ${
            product.is_new
              ? `<span class="new-badge">NEW</span>`
              : ""
          }

        </div>

        <div class="product-info">

          <p class="product-category">
            ${escapeHtml(product.category || "Maya")}
          </p>

          <h3>
            ${escapeHtml(product.name)}
          </h3>

          <p class="product-description">
            ${escapeHtml(product.description || "")}
          </p>

          <div class="product-bottom">

            <strong>
              ${formatPrice(product.price)}
            </strong>

            <button
              class="add-btn"
              data-id="${product.id}"
            >
              +
            </button>

          </div>

        </div>

      </article>

    `).join("");


  document
    .querySelectorAll(".add-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const product =
            products.find(
              p => p.id === button.dataset.id
            );

          if (product) {
            addToCart(product);
          }

        }
      );

    });

}


function escapeHtml(value) {

  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ======================================================
// CATEGORY
// ======================================================

document
  .querySelectorAll(".category-card")
  .forEach(card => {

    card.addEventListener(
      "click",
      () => {

        selectedCategory =
          card.dataset.category;

        renderProducts();

        document
          .getElementById("shop")
          .scrollIntoView({
            behavior: "smooth"
          });

      }
    );

  });


document
  .getElementById("clearFilter")
  .addEventListener(
    "click",
    () => {

      selectedCategory = null;

      renderProducts();

    }
  );


// ======================================================
// SEARCH
// ======================================================

document
  .getElementById("searchBtn")
  .addEventListener(
    "click",
    () => {

      document
        .getElementById("searchBox")
        .classList.add("active");

      document
        .getElementById("searchInput")
        .focus();

    }
  );


document
  .getElementById("closeSearch")
  .addEventListener(
    "click",
    () => {

      document
        .getElementById("searchBox")
        .classList.remove("active");

      document
        .getElementById("searchInput")
        .value = "";

      renderProducts();

    }
  );


document
  .getElementById("searchInput")
  .addEventListener(
    "input",
    renderProducts
  );


// ======================================================
// CART
// ======================================================

function addToCart(product) {

  const existing =
    cart.find(
      item => item.id === product.id
    );

  if (existing) {

    existing.quantity++;

  } else {

    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: 1
    });

  }

  saveCart();

  renderCart();

  showToast(
    `${product.name} added to cart`
  );

}


function removeFromCart(id) {

  cart =
    cart.filter(
      item => item.id !== id
    );

  saveCart();

  renderCart();

}


function changeQuantity(id, amount) {

  const item =
    cart.find(
      product => product.id === id
    );

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {

    removeFromCart(id);

    return;

  }

  saveCart();

  renderCart();

}


function renderCart() {

  const totalItems =
    cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );

  cartCount.textContent =
    totalItems;


  if (!cart.length) {

    cartItems.innerHTML = `
      <div class="empty-cart">
        <div>🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add something from Maya.</p>
      </div>
    `;

  } else {

    cartItems.innerHTML =
      cart.map(item => `

        <div class="cart-item">

          <img
            src="${item.image_url || "https://placehold.co/100x120?text=MAYA"}"
            alt="${escapeHtml(item.name)}"
          />

          <div class="cart-item-info">

            <h4>
              ${escapeHtml(item.name)}
            </h4>

            <strong>
              ${formatPrice(item.price)}
            </strong>

            <div class="quantity">

              <button
                data-action="minus"
                data-id="${item.id}"
              >
                −
              </button>

              <span>
                ${item.quantity}
              </span>

              <button
                data-action="plus"
                data-id="${item.id}"
              >
                +
              </button>

            </div>

          </div>

          <button
            class="remove-cart"
            data-action="remove"
            data-id="${item.id}"
          >
            ×
          </button>

        </div>

      `).join("");

  }


  const total =
    cart.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );

  cartTotal.textContent =
    formatPrice(total);


  document
    .querySelectorAll("[data-action]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.id;

          const action =
            button.dataset.action;

          if (action === "plus") {
            changeQuantity(id, 1);
          }

          if (action === "minus") {
            changeQuantity(id, -1);
          }

          if (action === "remove") {
            removeFromCart(id);
          }

        }
      );

    });

}


document
  .getElementById("cartBtn")
  .addEventListener(
    "click",
    () => {

      cartDrawer.classList.add("active");

      overlay.classList.add("active");

    }
  );


document
  .getElementById("closeCart")
  .addEventListener(
    "click",
    closePanels
  );


overlay.addEventListener(
  "click",
  closePanels
);


function closePanels() {

  cartDrawer.classList.remove("active");

  authModal.classList.remove("active");

  overlay.classList.remove("active");

}


// ======================================================
// MOBILE MENU
// ======================================================

document
  .getElementById("menuBtn")
  .addEventListener(
    "click",
    () => {

      document
        .getElementById("mobileMenu")
        .classList.add("active");

    }
  );


document
  .getElementById("closeMenu")
  .addEventListener(
    "click",
    () => {

      document
        .getElementById("mobileMenu")
        .classList.remove("active");

    }
  );


document
  .querySelectorAll(".mobile-menu a")
  .forEach(link => {

    link.addEventListener(
      "click",
      () => {

        document
          .getElementById("mobileMenu")
          .classList.remove("active");

      }
    );

  });


// ======================================================
// AUTH
// ======================================================

document
  .getElementById("accountBtn")
  .addEventListener(
    "click",
    async () => {

      authModal.classList.add("active");

      overlay.classList.add("active");

      await updateAuthUI();

    }
  );


document
  .getElementById("closeAuth")
  .addEventListener(
    "click",
    closePanels
  );


async function updateAuthUI() {

  const {
    data: {
      user
    }
  } =
    await supabase.auth.getUser();

  if (user) {

    authLoggedOut.classList.add("hidden");

    authLoggedIn.classList.remove("hidden");

    userEmail.textContent =
      user.email;

  } else {

    authLoggedOut.classList.remove("hidden");

    authLoggedIn.classList.add("hidden");

  }

}


document
  .getElementById("authForm")
  .addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const email =
        document
          .getElementById("authEmail")
          .value;

      const password =
        document
          .getElementById("authPassword")
          .value;

      const message =
        document
          .getElementById("authMessage");

      message.textContent =
        "Logging in...";


      const {
        error
      } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });


      if (error) {

        message.textContent =
          error.message;

        return;

      }


      message.textContent =
        "Login successful.";

      await updateAuthUI();

      showToast(
        "Welcome back to Maya"
      );

    }
  );


document
  .getElementById("signupBtn")
  .addEventListener(
    "click",
    async () => {

      const email =
        document
          .getElementById("authEmail")
          .value;

      const password =
        document
          .getElementById("authPassword")
          .value;

      if (!email || !password) {

        document
          .getElementById("authMessage")
          .textContent =
          "Enter email and password.";

        return;

      }


      const {
        error
      } =
        await supabase.auth.signUp({
          email,
          password
        });


      if (error) {

        document
          .getElementById("authMessage")
          .textContent =
          error.message;

        return;

      }


      document
        .getElementById("authMessage")
        .textContent =
        "Account created. Check your email.";

    }
  );


document
  .getElementById("logoutBtn")
  .addEventListener(
    "click",
    async () => {

      await supabase.auth.signOut();

      await updateAuthUI();

      showToast(
        "You have logged out."
      );

    }
  );


// ======================================================
// CHECKOUT
// ======================================================

document
  .getElementById("checkoutBtn")
  .addEventListener(
    "click",
    async () => {

      if (!cart.length) {

        showToast(
          "Your cart is empty."
        );

        return;

      }


      const {
        data: {
          user
        }
      } =
        await supabase.auth.getUser();


      if (!user) {

        closePanels();

        authModal.classList.add("active");

        overlay.classList.add("active");

        showToast(
          "Please login before checkout."
        );

        return;

      }


      const total =
        cart.reduce(
          (sum, item) =>
            sum + item.price * item.quantity,
          0
        );


      const {
        data: order,
        error
      } =
        await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            total_amount: total,
            status: "pending"
          })
          .select()
          .single();


      if (error) {

        console.error(error);

        showToast(
          "Could not create order."
        );

        return;

      }


      const orderItems =
        cart.map(item => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          price: item.price
        }));


      const {
        error: itemError
      } =
        await supabase
          .from("order_items")
          .insert(orderItems);


      if (itemError) {

        console.error(itemError);

        showToast(
          "Could not save order items."
        );

        return;

      }


      cart = [];

      saveCart();

      renderCart();

      showToast(
        "Order created successfully."
      );

    }
  );


// ======================================================
// NEWSLETTER
// ======================================================

document
  .getElementById("newsletterForm")
  .addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const email =
        document
          .getElementById("newsletterEmail")
          .value;

      const message =
        document
          .getElementById("newsletterMessage");


      const {
        error
      } =
        await supabase
          .from("newsletter")
          .insert({
            email
          });


      if (error) {

        if (
          error.code === "23505"
        ) {

          message.textContent =
            "This email is already subscribed.";

        } else {

          message.textContent =
            "Something went wrong.";

        }

        return;

      }


      message.textContent =
        "You're now part of Maya.";

      event.target.reset();

    }
  );


// ======================================================
// AUTH STATE
// ======================================================

supabase.auth.onAuthStateChange(
  () => {

    updateAuthUI();

  }
);


// ======================================================
// INIT
// ======================================================

loadProducts();

renderCart();

updateAuthUI();
