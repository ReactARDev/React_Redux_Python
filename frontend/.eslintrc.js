module.exports = {
  extends: "airbnb",
  parser: "babel-eslint",
  globals: {
    ga: true,
    fuckAdBlock: false,
    zxcvbn: {},
    Stripe: false,
    StripeCheckout: false,
    mixpanel: true,
    window: true,
    XMLHttpRequest: true,
    XMLSerializer: true,
    Blob: true,
    URL: true,
    localStorage: true,
    document: true,
    navigator: true,
    confirm: true,
  },
  rules: {
    "array-bracket-spacing": 0,
    "arrow-body-style": [0, "always"],
    "func-names": 0,
    "react/jsx-quotes": 0,
    "jsx-quotes": 0,
    //TODO: enable this rule when eslint-plugin-react adds support for RelayContainer:
    //      https://github.com/yannickcr/eslint-plugin-react/issues/241
    "react/prop-types": 0,
    "space-infix-ops": 0,
    "prefer-template": 0,
    "no-dupe-class-members": "error",
    "no-useless-constructor": 0,
    "prefer-template": 0,
    "no-param-reassign": 0,
    "no-unused-vars": ["error", { args: "none" }],
    camelcase: 0,
    quotes: 0,
    "spaced-comment": 0,
    "comma-spacing": 0,
    "comma-dangle": ["error", "never"],
    "no-extraneous-dependencies": 0,
    "import/no-extraneous-dependencies": 0,
    "import/first": 0,
    "import/extensions": 0,
    "no-underscore-dangle": 0,
    "function-paren-newline": 0,
    "react/jsx-filename-extension": 0,
    "arrow-parens": 0,
    "no-restricted-syntax": 0,
    "prefer-destructuring": 0,
    "no-lonely-if": 0,
    "no-continue": 0,
    "no-plusplus": 0,
    "object-curly-newline": 0,
    "jsx-a11y/anchor-is-valid": 0,
    "react/jsx-curly-brace-presence": 0,
    "react/no-string-refs": 0,
    "jsx-a11y/no-autofocus": 0,
    "jsx-a11y/no-static-element-interactions": 0,
    "jsx-a11y/click-events-have-key-events": 0,
    "jsx-a11y/iframe-has-title": 0,
    "react/no-find-dom-node": 0,
    "react/no-array-index-key": 0,
    "no-empty-pattern": 0,
    "import/no-named-as-default": 0,
    "class-methods-use-this": 0,
    "react/no-danger": 0,
    "jsx-a11y/no-noninteractive-element-interactions": 0,
    "import/prefer-default-export": 0,
    "react/jsx-wrap-multilines": 0,
    "jsx-a11y/label-has-for": 0,
    "no-bitwise": 0,
    "import/newline-after-import": 0,
    "react/no-children-prop": 0,
    "no-useless-concat": 0,
    "no-useless-return": 0,
    "react/jsx-no-bind": 0,
    "react/no-unescaped-entities": 0,
    "no-useless-escape": 0,
    "react/no-unused-state": 0,
    "no-mixed-operators": 0,
    "react/no-typos": 0,
    "no-self-compare": 0,
    "no-restricted-globals": 0,
    "jsx-a11y/anchor-has-content": 0,
    "no-alert": 0,
  }
};
