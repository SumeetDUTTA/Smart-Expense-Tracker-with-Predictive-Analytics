// eslint.config.js
// Flat ESLint config suitable for JS/React and TypeScript projects.
// Adjust plugins/extensions as needed for your project.

module.exports = [
    {
        ignores: ['node_modules/**', 'dist/**', 'build/**', '.git/**'],
    },

    // JavaScript / JSX
    {
        files: ['**/*.js', '**/*.cjs', '**/*.mjs', '**/*.jsx'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
            },
            globals: {
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                process: 'readonly',
            },
        },
        plugins: {
            react: require('eslint-plugin-react'),
            'react-hooks': require('eslint-plugin-react-hooks'),
            'jsx-a11y': require('eslint-plugin-jsx-a11y'),
            import: require('eslint-plugin-import'),
            prettier: require('eslint-plugin-prettier'),
        },
        settings: {
            react: { version: 'detect' },
            'import/resolver': { node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] } },
        },
        rules: {
            'prettier/prettier': 'error',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'import/no-unresolved': 'error',
            'react/prop-types': 'off',
            'react/jsx-uses-react': 'off',
            'react/react-in-jsx-scope': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'jsx-a11y/anchor-is-valid': 'warn',
        },
    },

    // TypeScript / TSX
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: require('@typescript-eslint/parser'),
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                project: './tsconfig.json',
                ecmaFeatures: { jsx: true },
            },
        },
        plugins: {
            '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
            react: require('eslint-plugin-react'),
            'react-hooks': require('eslint-plugin-react-hooks'),
            'jsx-a11y': require('eslint-plugin-jsx-a11y'),
            import: require('eslint-plugin-import'),
            prettier: require('eslint-plugin-prettier'),
        },
        settings: {
            react: { version: 'detect' },
            'import/resolver': {
                typescript: { project: './tsconfig.json' },
            },
        },
        rules: {
            'prettier/prettier': 'error',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'import/no-unresolved': 'off', // handled by TS resolver
            'react/jsx-uses-react': 'off',
            'react/react-in-jsx-scope': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
        },
    },

    // Node scripts / config files
    {
        files: ['**/*.cjs', 'scripts/**', '.eslintrc.*'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'script',
            globals: { require: 'readonly', module: 'readonly' },
        },
        rules: {
            'no-console': 'off',
        },
    },
];