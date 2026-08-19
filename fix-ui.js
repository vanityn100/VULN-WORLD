const fs = require('fs');
const path = require('path');

const sharedCss = "body { font-family: sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }\nheader { background: #333; color: white; padding: 10px 20px; margin-bottom: 20px; border-radius: 4px; }\nheader h1 { margin: 0; font-size: 24px; }\n.container { max-width: 800px; margin: 20px auto; background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }\na { color: #0056b3; text-decoration: none; margin-right: 15px; font-weight: bold; }\na:hover { text-decoration: underline; }\nbutton { background: #333; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }\ninput { padding: 8px; margin-right: 10px; border: 1px solid #ccc; border-radius: 4px; }\npre { background: #eee; padding: 10px; border-radius: 4px; overflow-x: auto; }";

const sharedDir = path.join(__dirname, 'public', 'shared');
if (!fs.existsSync(sharedDir)) fs.mkdirSync(sharedDir, { recursive: true });
fs.writeFileSync(path.join(sharedDir, 'style.css'), sharedCss);

const labsDir = path.join(__dirname, 'labs');
const labs = fs.readdirSync(labsDir);

labs.forEach(labId => {
  const labPath = path.join(labsDir, labId);
  const viewsDir = path.join(labPath, 'views');
  const indexJsPath = path.join(labPath, 'index.js');
  const publicDir = path.join(labPath, 'public');
  
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'style.css'), "/* Specific styles for " + labId + " */");

  if (fs.existsSync(viewsDir)) {
    const views = fs.readdirSync(viewsDir);
    views.forEach(view => {
      if (view.endsWith('.ejs')) {
        let content = fs.readFileSync(path.join(viewsDir, view), 'utf8');
        content = content.replace(/<style>[\s\S]*?<\/style>/, 
          '<link rel="stylesheet" href="/shared/style.css">\n  <link rel="stylesheet" href="/labs/' + labId + '/style.css">');
        fs.writeFileSync(path.join(viewsDir, view), content);
      }
    });
  }

  if (fs.existsSync(indexJsPath)) {
    let indexJs = fs.readFileSync(indexJsPath, 'utf8');
    
    indexJs = indexJs.replace(
      /router\.get\('\/', \(req, res\) => res\.send\('<html><body>SocialSphere.*?<\/body><\/html>'\)\);/,
      "router.get('/', (req, res) => { db.all('SELECT * FROM posts', (err, posts) => { res.render('home', { labName: 'SocialSphere', posts: posts || [] }); }); });"
    );
    
    indexJs = indexJs.replace(
      /router\.get\('\/', \(req, res\) => res\.send\('BookBay <form.*?<\/form>'\)\);/,
      "router.get('/', (req, res) => res.render('home', { labName: 'BookBay', customHtml: '<form action=\"/labs/bookbay/search\"><input name=\"q\"><button>Search</button></form>' }));"
    );
    
    indexJs = indexJs.replace(
      /router\.get\('\/', \(req, res\) => res\.send\('PixDrop <form.*?<\/form>'\)\);/,
      "router.get('/', (req, res) => res.render('home', { labName: 'PixDrop', customHtml: '<form action=\"/labs/pixdrop/import\"><input name=\"url\"><button>Import</button></form>' }));"
    );
    
    indexJs = indexJs.replace(
      /router\.get\('\/', \(req, res\) => res\.send\('FileVault.*?<\/form>'\)\);/,
      "router.get('/', (req, res) => res.render('home', { labName: 'FileVault', customHtml: '<br> <a href=\"/labs/filevault/download?file=public.txt\">Download Public</a> <br> <form action=\"/labs/filevault/diagnostic\"><input name=\"target\" value=\"127.0.0.1\"><button>Ping</button></form>' }));"
    );
    
    indexJs = indexJs.replace(
      /router\.get\('\/', \(req, res\) => \{\n  res\.send\('<html><body>TemplateWorks.*?<\/body><\/html>'\);\n\}\);/,
      "router.get('/', (req, res) => res.render('home', { labName: 'TemplateWorks', customHtml: '<form action=\"/labs/templateworks/render\"><input name=\"tpl\" value=\"Hello {{user.name}}\"><button>Render</button></form>' }));"
    );

    indexJs = indexJs.replace(
      /router\.get\('\/', \(req, res\) => res\.send\('(.*?)'\)\);/,
      (match, p1) => {
        if (!match.includes('res.render')) {
          let title = labId.charAt(0).toUpperCase() + labId.slice(1);
          return "router.get('/', (req, res) => res.render('home', { labName: '" + title + "', customHtml: '" + p1 + "' }));";
        }
        return match;
      }
    );

    fs.writeFileSync(indexJsPath, indexJs);
  }
});

labs.forEach(labId => {
  const homeEjsPath = path.join(labsDir, labId, 'views', 'home.ejs');
  if (fs.existsSync(homeEjsPath)) {
    let content = fs.readFileSync(homeEjsPath, 'utf8');
    if (!content.includes('customHtml')) {
      content = content.replace(
        /<p>This is a realistic lab application\.<\/p>/,
        "<p>This is a realistic lab application.</p>\n    <% if (typeof customHtml !== 'undefined') { %>\n      <%- customHtml %>\n    <% } %>"
      );
      fs.writeFileSync(homeEjsPath, content);
    }
  }
});

console.log('UI Restoration and CSS linking complete.');
