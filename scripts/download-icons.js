const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

const icons = [
  {
    url: "https://www.figma.com/api/mcp/asset/3a1a11e5-d748-4d29-8443-647eafa7131f.svg",
    out: "assets/icons/feedback/success.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/02fcd9d6-479f-4407-b973-c87cdbf3c96c.svg",
    out: "assets/icons/feedback/warning.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/4e33688d-7d1e-4c4e-af4c-d0f899df8836.svg",
    out: "assets/icons/feedback/information.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/34249703-a1ee-4168-94c8-ef5bd6a4aaad.svg",
    out: "assets/icons/feedback/processing.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/cea7b64d-160a-40ea-bfc9-b20bf0678870.svg",
    out: "assets/icons/utility/chevron-down.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/63ab4b4a-2fb3-4654-9893-21c6fe9c0dec.svg",
    out: "assets/icons/utility/chevron-left.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/2e20f667-d318-4f9d-b3a5-97c03b705eb5.svg",
    out: "assets/icons/utility/chevron-right.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/f5d86557-82c6-4dbd-b398-7c0ec60d0a8f.svg",
    out: "assets/icons/utility/add.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/333a08b1-f905-4ac4-8b9b-b4bc9ad1f25a.svg",
    out: "assets/icons/utility/selection-check.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/1051e2c7-5fd4-45f1-9389-0e503b151d49.svg",
    out: "assets/icons/nav/owner-home-selected.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/f4dab702-b276-4c4b-a81b-03415233807c.svg",
    out: "assets/icons/nav/owner-home-default.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/10558212-f1b3-4a39-9d27-3aa45c46a70c.svg",
    out: "assets/icons/nav/owner-activity-selected.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/71f5cbfe-0878-4dc7-b3a5-0f651907e995.svg",
    out: "assets/icons/nav/owner-activity-default.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/914373fe-bece-467e-b878-448a6e3f758f.svg",
    out: "assets/icons/nav/owner-invoices-selected.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/901cac87-a293-4b28-869f-9343b6f193ec.svg",
    out: "assets/icons/nav/owner-invoices-default.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/f3ed8eea-d4b2-4421-9eef-082d476807f4.svg",
    out: "assets/icons/nav/owner-documents-selected.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/22e5ebc6-795d-47f5-a067-edf99eb2f9d2.svg",
    out: "assets/icons/nav/owner-documents-default.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/9b9f77b8-f9ec-481b-81c3-39fd9b2bcee9.svg",
    out: "assets/icons/nav/owner-libros-ai-selected.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/d7e479b7-bf5f-445b-84ed-a8fa485655d9.svg",
    out: "assets/icons/nav/owner-libros-ai-default.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/59bcbfde-63d7-4dea-949f-b5e39ae8184c.svg",
    out: "assets/icons/nav/role-expenses-selected.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/b84e7714-4e74-4de9-962e-c4c1f11538ab.svg",
    out: "assets/icons/nav/role-expenses-default.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/2f407a80-d8e2-44c4-a71a-e78cfe386f2e.svg",
    out: "assets/icons/nav/role-overview-selected.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/b91e70e6-3518-4254-bfb9-45de564122c8.svg",
    out: "assets/icons/nav/role-overview-default.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/5cc0125e-5ac1-4e3e-b122-9ebcb1e2f3fa.svg",
    out: "assets/icons/nav/role-reports-selected.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/3ced373e-dc19-4bba-99f7-216eed02f632.svg",
    out: "assets/icons/nav/role-reports-default.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/8a508bae-d22d-4bf9-9b92-1d441136f70e.svg",
    out: "assets/icons/nav/role-account-selected.svg",
  },
  {
    url: "https://www.figma.com/api/mcp/asset/d1272467-8b8d-4ac0-9102-063235ac4b5a.svg",
    out: "assets/icons/nav/role-account-default.svg",
  },
];

function download(url, outPath) {
  return new Promise((resolve, reject) => {
    const fullPath = path.resolve(__dirname, "..", outPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    const file = fs.createWriteStream(fullPath);
    https
      .get(url, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          https
            .get(res.headers.location, (redirectRes) => {
              redirectRes.pipe(file);
              file.on("finish", () => file.close(resolve));
            })
            .on("error", reject);
        } else {
          res.pipe(file);
          file.on("finish", () => file.close(resolve));
        }
      })
      .on("error", reject);
  });
}

async function run() {
  for (const item of icons) {
    await download(item.url, item.out);
    console.log(`Downloaded ${item.out}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
