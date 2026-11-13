import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = (name: string) =>
  readFileSync(new URL("../" + name, import.meta.url), "utf8");
test("演示会员使用只读联系标识，免除真实手机号校验", () => {
  const s = source("src/pages/Members/MemberForm.tsx");
  assert.match(s, /member\?\.isDemo/);
  assert.match(s, /disabled=\{!!member\?\.isDemo\}/);
});
test("长会员表单限定内部滚动，保存按钮保留在内容区外", () => {
  const s = source("src/pages/Members/MemberForm.tsx");
  assert.match(s, /styles=\{\{\s*body:/);
  assert.match(s, /maxHeight:\s*["']calc\(100dvh/);
  assert.match(s, /overflowY:\s*["']auto/);
});
