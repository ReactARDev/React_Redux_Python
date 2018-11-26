#!/bin/sh -ue
export NODE_ENV=production
webpack --config webpack.app.config.prod.js
webpack --config webpack.admin.config.prod.js
#cp -R ./public/* ./dist
cp ./public/favicon.ico ./dist/
cp ./public/index.html ./dist/app/index.html
cp ./public/admin.html ./dist/admin/index.html
