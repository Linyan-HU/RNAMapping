import test from 'node:test';
import assert from 'node:assert/strict';
import { cssVarsFor, themeTokens } from '../src/theme.js';

test('theme token coverage for ten color themes', () => {
  assert.deepEqual(Object.keys(themeTokens).sort(), [
    'blue',
    'brown',
    'bw',
    'gray',
    'green',
    'orange',
    'pink',
    'purple',
    'red',
    'yellow'
  ]);
});

test('light mode vars include expected tokens', () => {
  const vars = cssVarsFor('blue', 'light');
  assert.ok(vars.includes('--primary: #2563EB;'));
  assert.ok(vars.includes('--background: #F8FAFC;'));
  assert.ok(vars.includes('--textPrimary: #0F172A;'));
});

test('dark mode vars include dark tokens', () => {
  const vars = cssVarsFor('purple', 'dark');
  assert.ok(vars.includes('--background: #020617;'));
  assert.ok(vars.includes('--textPrimary: #E2E8F0;'));
  assert.ok(vars.includes('--mode: dark;'));
});

test('dark mode includes onPrimary for button contrast', () => {
  const vars = cssVarsFor('yellow', 'dark');
  assert.ok(vars.includes('--onPrimary: #020617;'));
});

test('fallback theme works', () => {
  const vars = cssVarsFor('unknown', 'light');
  assert.ok(vars.includes('--primary: #2563EB;'));
});
