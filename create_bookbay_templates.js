const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'labs', 'bookbay', 'views');

const headerContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><%= labName %></title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="/shared/style.css">
</head>
<body class="bg-gray-50 font-sans">
  <header class="bg-slate-900 text-white">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="/labs/bookbay" class="text-2xl font-bold text-amber-500 hover:text-amber-400 transition">📚 <%= labName %></a>
      <div class="flex-grow max-w-2xl mx-6">
        <form action="/labs/bookbay/search" method="GET" class="flex w-full rounded-md overflow-hidden shadow-sm">
          <input type="text" name="q" placeholder="Search..." class="flex-grow px-4 py-2 text-gray-900 outline-none">
          <button type="submit" class="bg-amber-500 hover:bg-amber-600 text-slate-900 px-6 py-2 font-semibold">Search</button>
        </form>
      </div>
      <a href="/labs/bookbay/cart" class="flex items-center space-x-1 hover:text-amber-500 transition">
        <span class="text-2xl">🛒</span><span class="font-bold">Cart <span class="text-amber-500">(<%= cartItemCount %>)</span></span>
      </a>
    </div>
  </header>
  <main class="max-w-7xl mx-auto px-4 py-8">
`;

const footerContent = `
  </main>
  <div class="max-w-7xl mx-auto px-4 mt-8"><%- include('../../../views/partials/helper') %></div>
  <footer class="bg-slate-900 mt-16 py-8"><div class="max-w-7xl mx-auto px-4 text-center"><form action="/labs/bookbay/reset" method="POST"><button type="submit" class="text-slate-400 hover:text-white text-sm transition-colors hover:underline">Reset Lab Environment</button></form></div></footer>
</body>
</html>`;

const bookEjs = `${headerContent}
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
      <div class="md:w-1/3">
        <div class="bg-gray-100 rounded-md w-full aspect-[2/3] flex items-center justify-center relative overflow-hidden">
          <span class="text-gray-400 font-medium">Cover</span>
        </div>
      </div>
      <div class="md:w-2/3 flex flex-col">
        <h1 class="text-3xl font-bold text-slate-900 mb-2"><%= book.title %></h1>
        <p class="text-lg text-gray-600 mb-4">by <%= book.author %></p>
        <p class="text-gray-800 mb-6 flex-grow"><%= book.description %></p>
        <div class="text-3xl font-bold text-slate-900 mb-4">$<%= book.price.toFixed(2) %></div>
        <p class="text-sm text-green-600 font-semibold mb-4"><%= book.stock > 0 ? 'In Stock' : 'Out of Stock' %></p>
        
        <form action="/labs/bookbay/cart/add" method="POST" class="flex space-x-4">
          <input type="hidden" name="bookId" value="<%= book.id %>">
          <div class="w-24">
            <input type="number" name="quantity" value="1" min="1" max="<%= book.stock %>" class="w-full border border-gray-300 rounded-md px-3 py-2">
          </div>
          <button type="submit" class="flex-grow bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-2 rounded-full transition-colors shadow-sm">
            Add to Cart
          </button>
        </form>
      </div>
    </div>
${footerContent}`;

const cartEjs = `${headerContent}
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Shopping Cart</h1>
    <% if (cart.length === 0) { %>
      <div class="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <p class="text-lg text-gray-600 mb-4">Your cart is empty.</p>
        <a href="/labs/bookbay" class="text-blue-600 hover:underline">Continue Shopping</a>
      </div>
    <% } else { %>
      <div class="flex flex-col lg:flex-row gap-6">
        <div class="lg:w-3/4 space-y-4">
          <% cart.forEach(item => { %>
            <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
              <div>
                <h3 class="font-bold text-slate-900"><%= item.title %></h3>
                <p class="text-gray-600 text-sm">$<%= item.price.toFixed(2) %></p>
              </div>
              <div class="flex items-center space-x-4">
                <form action="/labs/bookbay/cart/update" method="POST" class="flex items-center space-x-2">
                  <input type="hidden" name="bookId" value="<%= item.bookId %>">
                  <input type="number" name="quantity" value="<%= item.quantity %>" min="1" class="w-16 border border-gray-300 rounded px-2 py-1">
                  <button type="submit" class="text-sm bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">Update</button>
                </form>
                <form action="/labs/bookbay/cart/remove" method="POST">
                  <input type="hidden" name="bookId" value="<%= item.bookId %>">
                  <button type="submit" class="text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>
                </form>
              </div>
            </div>
          <% }) %>
        </div>
        <div class="lg:w-1/4">
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-4">
            <h3 class="font-bold text-lg mb-4">Order Summary</h3>
            <div class="flex justify-between mb-4 text-lg">
              <span>Subtotal:</span>
              <span class="font-bold">$<%= subtotal.toFixed(2) %></span>
            </div>
            <a href="/labs/bookbay/checkout" class="block w-full text-center bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-3 rounded-full transition-colors shadow-sm">
              Proceed to Checkout
            </a>
          </div>
        </div>
      </div>
    <% } %>
${footerContent}`;

const checkoutEjs = `${headerContent}
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Checkout</h1>
    <div class="flex flex-col lg:flex-row gap-6">
      <div class="lg:w-2/3 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 class="text-lg font-bold mb-4 border-b pb-2">Delivery Information</h2>
        <form action="/labs/bookbay/checkout" method="POST" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" name="name" required class="mt-1 w-full border border-gray-300 rounded-md shadow-sm px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Address</label>
            <textarea name="address" required class="mt-1 w-full border border-gray-300 rounded-md shadow-sm px-3 py-2" rows="3"></textarea>
          </div>
          <button type="submit" class="mt-6 w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-3 rounded-md transition-colors shadow-sm">
            Place Order ($<%= total.toFixed(2) %>)
          </button>
        </form>
      </div>
      <div class="lg:w-1/3 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 class="text-lg font-bold mb-4 border-b pb-2">Order Summary</h2>
        <ul class="space-y-3 mb-4">
          <% cart.forEach(item => { %>
            <li class="flex justify-between text-sm">
              <span><%= item.quantity %>x <%= item.title %></span>
              <span>$<%= (item.price * item.quantity).toFixed(2) %></span>
            </li>
          <% }) %>
        </ul>
        <div class="flex justify-between font-bold text-lg border-t pt-4">
          <span>Total:</span>
          <span>$<%= total.toFixed(2) %></span>
        </div>
      </div>
    </div>
${footerContent}`;

const orderEjs = `${headerContent}
    <div class="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
      <div class="text-5xl mb-4">🎉</div>
      <h1 class="text-3xl font-bold text-green-600 mb-2">Order Confirmed!</h1>
      <p class="text-gray-600 text-lg mb-6">Thank you for your purchase, <%= order.name %>.</p>
      <div class="bg-gray-50 p-4 rounded-md text-left mb-6">
        <p class="font-mono text-sm text-gray-500 mb-2">Order #BB-<%= order.id.toString().padStart(5, '0') %></p>
        <p class="text-sm"><strong>Shipping Address:</strong><br><%= order.address %></p>
        <p class="mt-3 font-bold text-lg">Total Paid: $<%= order.total.toFixed(2) %></p>
      </div>
      <a href="/labs/bookbay" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors">
        Continue Shopping
      </a>
    </div>
${footerContent}`;

fs.writeFileSync(path.join(viewsDir, 'book.ejs'), bookEjs);
fs.writeFileSync(path.join(viewsDir, 'cart.ejs'), cartEjs);
fs.writeFileSync(path.join(viewsDir, 'checkout.ejs'), checkoutEjs);
fs.writeFileSync(path.join(viewsDir, 'order.ejs'), orderEjs);

console.log("Templates created successfully!");
