cd react_project
npm i avataaars2
sed -i '/_this.forceUpdate()/d' node_modules/avataaars/dist/options/Selector.js
npm i
npm run dev -- --host