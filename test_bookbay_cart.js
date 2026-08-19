const http = require('http');

const PORT = 3000;

function request(method, path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        ...headers
      }
    };
    
    if (data) {
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTest() {
  console.log("Starting BookBay Cart Test...");
  try {
    // 1. Reset lab
    const resReset = await request('POST', '/labs/bookbay/reset');
    const cookie = resReset.headers['set-cookie'] ? resReset.headers['set-cookie'][0].split(';')[0] : '';
    console.log("Session Cookie:", cookie);

    // 2. Open catalog
    const resHome = await request('GET', '/labs/bookbay/', null, { 'Cookie': cookie });
    if (resHome.statusCode === 200) console.log("PASS: Catalog opened");

    // 3. Get book details
    const resBook = await request('GET', '/labs/bookbay/book/1', null, { 'Cookie': cookie });
    if (resBook.body.includes('Python Crash Course')) console.log("PASS: Book details loaded");

    // 4. Add book to cart
    const resAdd = await request('POST', '/labs/bookbay/cart/add', 'bookId=1&quantity=1', { 'Cookie': cookie });
    if (resAdd.statusCode === 302) console.log("PASS: Added to cart redirect");

    // 5. Read cart
    const resCart = await request('GET', '/labs/bookbay/cart', null, { 'Cookie': cookie });
    if (resCart.body.includes('Python Crash Course')) {
      console.log("PASS: Book exists in cart");
    } else {
      console.log("FAIL: Book not in cart");
    }

    // 6. Update quantity
    const resUpdate = await request('POST', '/labs/bookbay/cart/update', 'bookId=1&quantity=5', { 'Cookie': cookie });
    if (resUpdate.statusCode === 302) console.log("PASS: Updated cart redirect");

    // 7. Verify quantity
    const resCart2 = await request('GET', '/labs/bookbay/cart', null, { 'Cookie': cookie });
    if (resCart2.body.includes('value="5"')) {
      console.log("PASS: Quantity updated to 5");
    } else {
      console.log("FAIL: Quantity not updated");
    }

    // 8. Remove book
    const resRemove = await request('POST', '/labs/bookbay/cart/remove', 'bookId=1', { 'Cookie': cookie });
    if (resRemove.statusCode === 302) console.log("PASS: Removed book redirect");

    // 9. Verify empty cart
    const resCart3 = await request('GET', '/labs/bookbay/cart', null, { 'Cookie': cookie });
    if (resCart3.body.includes('Your cart is empty')) {
      console.log("PASS: Cart is empty");
    } else {
      console.log("FAIL: Cart not empty after remove");
    }

    // 10. Add book again and checkout
    await request('POST', '/labs/bookbay/cart/add', 'bookId=2&quantity=2', { 'Cookie': cookie });
    
    // 11. Checkout process
    const checkoutPayload = "name=Test+User&address=123+Fake+St";
    const resCheckout = await request('POST', '/labs/bookbay/checkout', checkoutPayload, { 'Cookie': cookie });
    if (resCheckout.statusCode === 302) {
      console.log("PASS: Checkout redirect");
      const orderPath = resCheckout.headers.location;
      
      const resOrder = await request('GET', orderPath, null, { 'Cookie': cookie });
      if (resOrder.body.includes('Order Confirmed!')) {
        console.log("PASS: Order confirmed page");
      } else {
        console.log("FAIL: Order confirmation missing");
      }
    } else {
      console.log("FAIL: Checkout POST failed");
    }

    // 12. Verify cart cleared
    const resCart4 = await request('GET', '/labs/bookbay/cart', null, { 'Cookie': cookie });
    if (resCart4.body.includes('Your cart is empty')) {
      console.log("PASS: Cart cleared after checkout");
    } else {
      console.log("FAIL: Cart not cleared after checkout");
    }

  } catch (err) {
    console.error("Test failed:", err);
  }
}

runTest();
