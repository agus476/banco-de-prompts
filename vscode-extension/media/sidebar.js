/* global acquireVsCodeApi */
(() => {
  const vscode = acquireVsCodeApi();
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    if (button.dataset.command) vscode.postMessage({ type: "command", command: button.dataset.command });
    if (button.dataset.index !== undefined) vscode.postMessage({ type: "recent", index: Number(button.dataset.index) });
  });
  window.addEventListener("message", ({ data }) => {
    if (data.type !== "state") return;
    const labels = { idle: "Sin comprobar", checking: "Conectando", connected: "Conectado", error: "Revisar conexión" };
    document.getElementById("status").dataset.status = data.status;
    document.getElementById("status-label").textContent = labels[data.status] || labels.idle;
    document.getElementById("endpoint").textContent = data.apiUrl;
    document.getElementById("connection-detail").textContent = data.detail;
    document.getElementById("token-button").textContent = data.hasToken ? "Cambiar token" : "Configurar token";
    document.getElementById("check-button").disabled = data.status === "checking";
    document.querySelectorAll("[data-import]").forEach((button) => { button.disabled = data.busy; });
    document.getElementById("import-hint").textContent = data.busy ? "Importación en curso. Continuá en el selector de VS Code." : "Vos elegís el chat, los turnos y el proyecto.";
    const history = Array.isArray(data.history) ? data.history : [];
    document.getElementById("empty-history").hidden = history.length > 0;
    document.getElementById("clear-history").hidden = history.length === 0;
    const list = document.getElementById("recent-list");
    list.replaceChildren();
    history.forEach((item, index) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.className = "recent-item";
      button.dataset.index = String(index);
      const text = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = item.source;
      const detail = document.createElement("span");
      detail.textContent = `${item.count} ${item.count === 1 ? "interacción guardada" : "interacciones guardadas"}`;
      const date = document.createElement("time");
      date.dateTime = item.at;
      date.textContent = new Date(item.at).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
      button.setAttribute("aria-label", `Abrir importación de ${item.source}, ${detail.textContent}, ${date.textContent}`);
      text.append(title, detail);
      button.append(text, date);
      li.append(button);
      list.append(li);
    });
  });
  vscode.postMessage({ type: "ready" });
})();
