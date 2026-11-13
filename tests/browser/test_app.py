"""Real Chromium checks against a running production preview; all data is synthetic."""
import json
import os
import re
import time
import unittest
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.getenv("APP_URL", "http://127.0.0.1:4173/").rstrip("/") + "/"
HASH = os.getenv("APP_HASH_ROUTER", "0") == "1"
ARTIFACTS = Path(os.getenv("BROWSER_OUTPUT", "test-results/browser"))
KEY = "membership_system_snapshot_v2"

def member(id="m1", name="测试会员", phone="13800000001", **patch):
    return {"id": id, "memberNo": "VIP-" + id, "name": name, "phone": phone,
            "cardType": "times", "cardNumber": "CARD-" + id, "balance": 10,
            "points": 0, "remainingSessions": 5, "status": "active", "level": "bronze",
            "registrationDate": "2020-01-01", "expiryDate": "2099-01-01",
            "createdAt": "2026-01-01T00:00:00Z", "updatedAt": "2026-01-01T00:00:00Z", **patch}

def fixture():
    return {"version": "2.1.0", "id": "browser-fixture", "timestamp": "2026-11-13T04:00:00Z",
            "data": {"members": [member(), member("m2", "冻结会员", "13900000001", status="frozen")],
                     "transactions": [], "appointments": []}}

class BrowserChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ARTIFACTS.mkdir(parents=True, exist_ok=True)
        deadline = time.monotonic() + 60
        while True:
            try:
                with urllib.request.urlopen(BASE, timeout=3) as response:
                    if response.status == 200: break
            except Exception:
                if time.monotonic() >= deadline: raise RuntimeError("Production preview is not ready: " + BASE)
                time.sleep(.25)
        cls.playwright = sync_playwright().start()
        options = {"headless": True}
        if os.getenv("PLAYWRIGHT_CHANNEL"): options["channel"] = os.environ["PLAYWRIGHT_CHANNEL"]
        cls.browser = cls.playwright.chromium.launch(**options)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={"width": 1440, "height": 1000},
                                               locale="zh-CN", timezone_id="Asia/Shanghai", accept_downloads=True)
        self.page = self.context.new_page()
        self.page.set_default_timeout(10000)
        self.page.clock.install(time=datetime(2026, 11, 13, 4, tzinfo=timezone.utc))
        self.errors = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.on("console", lambda message: self.errors.append(message.text) if message.type == "error" else None)
        self.context.tracing.start(screenshots=True, snapshots=True)

    def tearDown(self):
        name = self.id().split(".")[-1]
        self.page.screenshot(path=str(ARTIFACTS / (name + ".png")), full_page=True)
        self.context.tracing.stop(path=str(ARTIFACTS / (name + ".zip")))
        self.context.close()
        self.assertEqual(self.errors, [], "Browser runtime errors")

    def url(self, route):
        return BASE + ("#/" if HASH else "") + route

    def open(self, route="dashboard", data=None):
        payload = json.dumps(fixture() if data is None else data, ensure_ascii=False)
        self.page.add_init_script("""(() => {
            if (!sessionStorage.getItem('fixture-ready')) {
                localStorage.setItem(%s, %s);
                sessionStorage.setItem('fixture-ready', 'yes');
            }
        })();""" % (json.dumps(KEY), json.dumps(payload)))
        self.goto(route)

    def goto(self, route):
        self.page.goto(self.url(route))
        self.page.wait_for_load_state("networkidle")

    def snapshot(self):
        return self.page.evaluate("key => JSON.parse(localStorage.getItem(key))", KEY)["data"]

    def test_member_add_duplicate_and_reload(self):
        self.open("members")
        self.page.get_by_role("button", name="新增会员", exact=True).click()
        self.page.get_by_label("会员姓名", exact=True).fill("新增测试会员")
        self.page.get_by_label("手机号", exact=True).fill("13800000001")
        self.page.get_by_role("button", name="保存会员", exact=True).click()
        expect(self.page.get_by_text("手机号重复", exact=False)).to_be_visible()
        expect(self.page.get_by_label("会员姓名", exact=True)).to_have_value("新增测试会员")
        self.page.get_by_label("手机号", exact=True).fill("13700000001")
        self.page.get_by_role("button", name="保存会员", exact=True).click()
        expect(self.page.get_by_role("dialog")).to_have_count(0)
        self.page.reload();self.page.wait_for_load_state("networkidle")
        self.assertEqual(len(self.snapshot()["members"]), 3)
        expect(self.page.get_by_text("新增测试会员", exact=True)).to_be_visible()

    def test_recharge_double_click_and_consume_failure(self):
        self.open("transactions?action=recharge&member=m1")
        self.page.get_by_label("充值金额", exact=True).fill("20.20")
        self.page.get_by_role("button", name="确认充值", exact=True).dblclick()
        expect(self.page.get_by_role("dialog")).to_have_count(0)
        data = self.snapshot();self.assertEqual(data["members"][0]["balance"], 30.2)
        self.assertEqual(len(data["transactions"]), 1)
        self.goto("transactions?action=consume&member=m1")
        self.page.get_by_label("消费金额", exact=True).fill("999")
        self.page.get_by_role("button", name="确认扣款", exact=True).click()
        expect(self.page.get_by_text("余额不足", exact=False)).to_be_visible()
        expect(self.page.get_by_label("消费金额", exact=True)).to_have_value(re.compile(r"^999(?:\.0+)?$"))
        self.assertEqual(self.snapshot()["members"][0]["balance"], 30.2)

    def test_storage_write_failure_keeps_input_and_state(self):
        self.open("transactions?action=consume&member=m1")
        self.page.get_by_label("消费金额", exact=True).fill("1.20")
        self.page.evaluate("""key => {
            const original = Storage.prototype.setItem;
            Storage.prototype.setItem = function(k,v) {
                if (k === key) throw new DOMException('测试空间不足', 'QuotaExceededError');
                return original.call(this,k,v);
            };
        }""", KEY)
        self.page.get_by_role("button", name="确认扣款", exact=True).click()
        expect(self.page.get_by_text("测试空间不足", exact=False)).to_be_visible()
        expect(self.page.get_by_label("消费金额", exact=True)).to_have_value("1.20")
        self.assertEqual(self.snapshot()["members"][0]["balance"], 10)
        self.assertEqual(len(self.snapshot()["transactions"]), 0)

    def test_search_and_archive_restore(self):
        self.open("members")
        search = self.page.get_by_label("搜索会员", exact=True)
        search.press_sequentially("冻结会员", delay=50)
        expect(self.page.locator("tr[data-row-key]")).to_have_count(1)
        expect(self.page.locator("tr[data-row-key]")).to_contain_text("冻结会员")
        self.page.get_by_role("button", name="重置筛选").click()
        row = self.page.locator('tr[data-row-key="m1"]')
        row.get_by_role("button", name=re.compile("归.*档")).click()
        self.page.get_by_role("dialog", name="归档会员？").get_by_role("button", name=re.compile("确.*定")).click()
        expect(self.page.locator('tr[data-row-key="m1"]')).to_have_count(0)
        self.goto("members?archive=yes")
        self.page.locator('tr[data-row-key="m1"]').get_by_role("button", name=re.compile("恢.*复")).click()
        self.page.get_by_role("dialog", name="恢复会员？").get_by_role("button", name=re.compile("确.*定")).click()
        expect(self.page.locator('tr[data-row-key="m1"]')).to_have_count(0)
        self.assertFalse(self.snapshot()["members"][0]["archived"])

    def test_export_import_preview_and_cancel(self):
        self.open("settings")
        with self.page.expect_download() as download_info:
            self.page.get_by_role("button", name="导出完整备份", exact=True).click()
        backup = json.loads(Path(download_info.value.path()).read_text(encoding="utf-8"))
        self.assertEqual(len(backup["data"]["members"]), 2)
        backup["data"]["members"][0]["name"] = "导入预览会员"
        self.page.locator('input[type="file"]').set_input_files({"name":"backup.json", "mimeType":"application/json", "buffer":json.dumps(backup).encode()})
        dialog = self.page.get_by_role("dialog", name="确认导入备份")
        expect(dialog).to_be_visible();self.assertEqual(self.snapshot()["members"][0]["name"], "测试会员")
        dialog.get_by_role("button", name=re.compile("取.*消")).click()
        expect(dialog).to_have_count(0)
        self.assertEqual(self.snapshot()["members"][0]["name"], "测试会员")
        self.page.locator('input[type="file"]').set_input_files({"name":"confirmed.json", "mimeType":"application/json", "buffer":json.dumps(backup).encode()})
        self.page.get_by_role("dialog", name="确认导入备份").get_by_role("button", name="确认导入", exact=True).click()
        expect(self.page.get_by_role("dialog")).to_have_count(0)
        self.assertEqual(self.snapshot()["members"][0]["name"], "导入预览会员")
        self.page.locator('input[type="file"]').set_input_files({"name":"broken.json", "mimeType":"application/json", "buffer":b'{"version":"99.0.0"}'})
        expect(self.page.get_by_text("导入失败", exact=False)).to_be_visible()
        self.assertEqual(self.snapshot()["members"][0]["name"], "导入预览会员")

    def test_import_storage_failure_can_retry(self):
        self.open("settings")
        backup = fixture();backup["data"]["members"][0]["name"] = "重试导入会员"
        self.page.locator('input[type="file"]').set_input_files({"name":"retry.json", "mimeType":"application/json", "buffer":json.dumps(backup).encode()})
        dialog = self.page.get_by_role("dialog", name="确认导入备份")
        expect(dialog).to_be_visible()
        self.page.evaluate("""key => {
            window.originalStorageWrite = Storage.prototype.setItem;
            Storage.prototype.setItem = function(k,v) {
                if (k === key) throw new DOMException('测试空间不足', 'QuotaExceededError');
                return window.originalStorageWrite.call(this,k,v);
            };
        }""", KEY)
        dialog.get_by_role("button", name="确认导入", exact=True).click()
        expect(self.page.get_by_text("测试空间不足", exact=False)).to_be_visible()
        expect(dialog).to_be_visible()
        self.assertEqual(self.snapshot()["members"][0]["name"], "测试会员")
        self.page.evaluate("() => { Storage.prototype.setItem = window.originalStorageWrite; }")
        dialog.get_by_role("button", name="确认导入", exact=True).click()
        expect(dialog).to_have_count(0)
        self.assertEqual(self.snapshot()["members"][0]["name"], "重试导入会员")

    def test_archive_storage_failure_can_retry(self):
        self.open("members")
        self.page.locator('tr[data-row-key="m1"]').get_by_role("button", name=re.compile("归.*档")).click()
        dialog = self.page.get_by_role("dialog", name="归档会员？")
        expect(dialog).to_be_visible()
        self.page.evaluate("""key => {
            window.originalStorageWrite = Storage.prototype.setItem;
            Storage.prototype.setItem = function(k,v) {
                if (k === key) throw new DOMException('测试空间不足', 'QuotaExceededError');
                return window.originalStorageWrite.call(this,k,v);
            };
        }""", KEY)
        dialog.get_by_role("button", name=re.compile("确.*定")).click()
        expect(self.page.get_by_text("测试空间不足", exact=False)).to_be_visible()
        expect(dialog).to_be_visible()
        self.assertFalse(self.snapshot()["members"][0].get("archived", False))
        self.page.evaluate("() => { Storage.prototype.setItem = window.originalStorageWrite; }")
        dialog.get_by_role("button", name=re.compile("确.*定")).click()
        expect(dialog).to_have_count(0)
        self.assertTrue(self.snapshot()["members"][0]["archived"])

    def test_corrupt_data_recovery_screen(self):
        self.open("settings", data="corrupt snapshot")
        expect(self.page.get_by_text("无法读取本地业务数据，已停止业务操作", exact=True)).to_be_visible()
        expect(self.page.get_by_role("heading", name="系统设置", exact=True)).to_be_visible()
        backup = fixture()
        self.page.locator('input[type="file"]').set_input_files({"name":"recovery.json", "mimeType":"application/json", "buffer":json.dumps(backup).encode()})
        self.page.get_by_role("dialog", name="确认导入备份").get_by_role("button", name="确认导入", exact=True).click()
        expect(self.page.get_by_text("无法读取本地业务数据，已停止业务操作", exact=True)).to_have_count(0)
        self.assertEqual(len(self.snapshot()["members"]), 2)

    def test_storage_denied_settings_remains_usable(self):
        self.page.add_init_script("Storage.prototype.getItem = function() { throw new DOMException('浏览器禁止本地存储', 'SecurityError'); };")
        self.goto("settings")
        expect(self.page.get_by_role("heading", name="系统设置", exact=True)).to_be_visible()
        expect(self.page.get_by_text("无法读取本地业务数据，已停止业务操作", exact=True)).to_be_visible()
        self.page.get_by_role("button", name="导出原始数据（故障恢复）", exact=True).click()
        expect(self.page.locator(".ant-message-notice").get_by_text("浏览器禁止本地存储", exact=True)).to_be_visible()

    def test_demo_edit_and_mobile_form(self):
        self.open("settings")
        self.page.get_by_role("button", name="添加演示数据", exact=True).click()
        expect(self.page.get_by_text("操作完成", exact=True)).to_be_visible()
        self.goto("members")
        row = self.page.locator("tr[data-row-key]").filter(has_text="演示会员")
        row.get_by_role("button", name=re.compile("编.*辑")).click()
        expect(self.page.get_by_label("演示联系标识（不用于联系）", exact=True)).to_be_disabled()
        self.page.get_by_label("会员姓名", exact=True).fill("演示会员已编辑")
        self.page.get_by_role("button", name="保存会员", exact=True).click()
        expect(self.page.get_by_role("dialog")).to_have_count(0)
        self.page.set_viewport_size({"width":390,"height":844})
        self.page.get_by_role("button", name="新增会员", exact=True).click()
        self.page.get_by_label("会员姓名", exact=True).fill("手机新增会员")
        self.page.get_by_label("手机号", exact=True).fill("13600000001")
        save = self.page.get_by_role("button", name="保存会员", exact=True)
        box = save.bounding_box();self.assertIsNotNone(box)
        self.assertGreaterEqual(box["y"], 0);self.assertLessEqual(box["y"] + box["height"], 844)
        self.assertTrue(self.page.locator(".ant-modal-body").evaluate("el => el.scrollHeight > el.clientHeight"))
        save.click();expect(self.page.get_by_role("dialog")).to_have_count(0)
        self.assertEqual(len(self.snapshot()["members"]), 4)

    def test_responsive_pages_navigation_and_reload(self):
        data = fixture()
        data["data"]["transactions"] = [{
            "id":"responsive-transaction", "memberId":"m1", "memberName":"测试会员",
            "type":"consume", "amount":1, "paymentMethod":"balance", "balanceBefore":11,
            "balanceAfter":10, "operator":"测试操作员", "createdAt":"2026-11-13T04:00:00Z", "sessions":1,
        }]
        self.open(data=data)
        for width in [390, 820, 1440]:
            self.page.set_viewport_size({"width":width,"height":1000})
            for route, title in [("dashboard","工作台"),("members","会员管理"),("transactions","交易记录"),("reports","数据报表"),("courses","课程管理"),("settings","系统设置")]:
                with self.subTest(width=width, route=route):
                    self.goto(route)
                    expect(self.page.get_by_role("heading", name=title, exact=True)).to_be_visible()
                    self.assertTrue(self.page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), "Page has horizontal overflow")
                    if route == "reports":
                        expect(self.page.locator(".recharts-wrapper > svg.recharts-surface")).to_have_count(2)
                        expect(self.page.locator(".recharts-line-curve")).to_have_count(3)
                        for chart in self.page.locator(".recharts-wrapper > svg.recharts-surface").all():
                            box = chart.bounding_box();self.assertIsNotNone(box)
                            self.assertGreater(box["width"], 0);self.assertGreater(box["height"], 0)
                    self.page.screenshot(path=str(ARTIFACTS / (str(width) + "-" + route + ".png")), full_page=True)
            self.goto("dashboard")
            if width < 992:
                self.page.get_by_role("button", name="打开导航菜单", exact=True).click()
                self.page.get_by_role("dialog", name="菜单", exact=True).get_by_role("menuitem", name=re.compile("会员管理")).click()
            else:
                self.page.get_by_role("menuitem", name=re.compile("会员管理")).click()
            expect(self.page.get_by_role("heading", name="会员管理", exact=True)).to_be_visible()
            self.page.reload();self.page.wait_for_load_state("networkidle")
            expect(self.page.get_by_role("heading", name="会员管理", exact=True)).to_be_visible()

class ReportingResult(unittest.TextTestResult):
    def report(self, test, err):
        if os.getenv("GITHUB_ACTIONS"):
            detail = self._exc_info_to_string(err, test).replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
            print("::error title=" + str(test).replace(",", "%2C") + "::" + detail, flush=True)
    def addFailure(self, test, err):
        super().addFailure(test, err);self.report(test, err)
    def addError(self, test, err):
        super().addError(test, err);self.report(test, err)
    def addSubTest(self, test, subtest, err):
        super().addSubTest(test, subtest, err)
        if err is not None: self.report(subtest, err)

if __name__ == "__main__":
    unittest.main(verbosity=2, testRunner=unittest.TextTestRunner(verbosity=2, resultclass=ReportingResult))
