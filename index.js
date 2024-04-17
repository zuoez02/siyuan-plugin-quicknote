const { Plugin, Setting, openTab } = require("siyuan");

const defaultConfig = {
  noteId: "",
};

class QuickNotePlugin extends Plugin {
  config = defaultConfig;

  async onload() {
    await this.loadConfig();
    this.saveConfig();

    const select = document.createElement("select");

    const topBarElement = this.addTopBar({
      icon: "iconAdd",
      title: this.i18n.title,
      position: "left",
      callback: () => {
        this.createNote();
      },
    });

    this.addCommand({
      langKey: "create",
      hotkey: "⇧⌘N",
      callback: () => {
        this.createNote();
      },
    });

    this.setting = new Setting({
      confirmCallback: () => {
        this.config.noteId = select.value;
        console.log(select.value);
        this.saveConfig();
      },
    });

    this.setting.addItem({
      title: this.i18n.notebook,
      createActionElement: () => {
        select.className = "b3-select";
        select.innerHTML = "";
        select.placeholder = "Select a notebook";
        select.value = this.config.noteId;
        this.getNoteBooks().then((list) => {
          list.forEach((item) => {
            const option = document.createElement("option");
            option.setAttribute("value", item.id);
            option.textContent = item.name;
            select.appendChild(option);
          });
        });
        return select;
      },
    });
  }

  async getNoteBooks() {
    return fetch("/api/notebook/lsNotebooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        return data.data.notebooks
          .filter((v) => !v.closed)
          .map((v) => ({ id: v.id, name: v.name }));
      });
  }

  async loadConfig() {
    const config = await this.loadData("config.json");
    if (!config) {
      this.apply();
      return;
    }
    this.config = Object.assign({}, this.config, config);
  }

  async saveConfig() {
    this.saveData("config.json", JSON.stringify(this.config));
  }

  async createNote() {
    if (!this.config.noteId) {
      return;
    }
    return fetch("/api/filetree/createDocWithMd", {
      method: "POST",
      body: JSON.stringify({
        notebook: this.config.noteId,
        path: "/" + new Date().toLocaleDateString().replaceAll("/", "-"),
        markdown: "",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        openTab({
          app: this.app,
          doc: {
            id: data.data,
          },
        });
      });
  }
}

module.exports = QuickNotePlugin;
