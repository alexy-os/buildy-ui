// @bun
function t(a,e){e.setHeader("Content-Type","text/html"),e.end(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buildy UI</title>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <style>
        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        .message {
            font-size: 1.2rem;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div id="app" class="container">
        <h1>{{ title }}</h1>
        <p class="message">{{ message }}</p>
    </div>

    <script>
        const { createApp } = Vue;
        
        createApp({
            data() {
                return {
                    title: 'Welcome to Buildy UI',
                    message: 'A modern component library for building beautiful websites'
                }
            }
        }).mount('#app');
    </script>
</body>
</html>
`)}export{t as default};
