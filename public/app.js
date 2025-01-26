if ("serviceWorker" in navigator && "SyncManager" in window) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((registration) => {
      registration.sync.register("sync-texts");
    })
    .then(() => {
      console.log("Background Sync registered");
    })
    .catch((err) => {
      console.error("Error registering Background Sync:", err);
    });
}

async function requestNotificationPermission() {
  if ("Notification" in window) {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notifications added.");
    } else {
      console.warn("Error adding notifications.");
    }
  } else {
    console.error("Notifications unavailable.");
  }
}

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
if (navigator.onLine) {
  if (SpeechRecognition) {
    const container = document.getElementById("container");
    const content = `
        <h1>Audio bilješke</h1>
        <select id="language-select">
            <option value="en-US">English (US)</option>
            <option value="hr-HR">Hrvatski</option>
            <option value="de-DE">Deutsch</option>
            <option value="fr-FR">Français</option>
            <option value="es-ES">Español</option>
        </select>
        <button id="start-btn">Start Listening</button>

        <p id="output">Say something...</p>
        <p id="output_value"></p>

        <button id="save">Spremi bilješku</button>
    `;
    container.innerHTML = content;

    const recognition = new SpeechRecognition();

    const startBtn = document.getElementById("start-btn");
    const output = document.getElementById("output");
    const output_value = document.getElementById("output_value");
    const languageSelect = document.getElementById("language-select");

    recognition.lang = languageSelect.value;

    languageSelect.addEventListener("change", () => {
      recognition.lang = languageSelect.value;
    });

    startBtn.addEventListener("click", () => {
      recognition.start();
      output.textContent = "Listening...";
    });

    recognition.addEventListener("result", async (event) => {
      const transcript = event.results[0][0].transcript;
      output.textContent = `You said:`;
      output_value.textContent = `${transcript}`;
    });

    recognition.addEventListener("end", () => {
      console.log("Speech recognition has stopped.");
    });

    recognition.addEventListener("error", (event) => {
      output.textContent = `Error occurred: ${event.error}`;
      console.error("Error: ", event.error);
    });
  } else {
    const container = document.getElementById("container");
    const content = `
    <h1>Bilješke (preglednik ne podržava SpeechRecognition API)</h1>
    <input type="text" id="text-input" placeholder="Enter text here">
        
        <button id="save-text">Save Text</button>

    <p id="output">Type something and save...</p>
    <p id="output_value"></p>

    <button id="save">Spremi bilješku</button>
`;
    container.innerHTML = content;
    const saveTextBtn = document.getElementById("save-text");
    saveTextBtn.addEventListener("click", function () {
      const textInput = document.getElementById("text-input");
      const outputValue = document.getElementById("output_value");

      outputValue.textContent = textInput.value;

      textInput.value = "";
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const addTextBtn = document.getElementById("save");
  const textList = document.getElementById("biljeske");
  let db;

  function openDB() {
    const request = indexedDB.open("NotesDatabase", 1);

    request.onupgradeneeded = function (event) {
      db = event.target.result;
      if (!db.objectStoreNames.contains("notes")) {
        db.createObjectStore("notes", { keyPath: "id" });
      }
    };

    request.onsuccess = function (event) {
      db = event.target.result;
      if (!navigator.onLine) {
        displayStoredTextsOffline();
      }
    };

    request.onerror = function () {
      console.error("Error opening database.");
    };
  }

  function addTextToDB(text, id) {
    const transaction = db.transaction(["notes"], "readwrite");
    const store = transaction.objectStore("notes");

    store.add({ text, id });

    transaction.oncomplete = function () {
      console.log("Text added to the database.");
    };

    transaction.onerror = function () {
      console.error("Error adding text.");
    };
  }

  function deleteTextFromDB(id) {
    if (!navigator.onLine) {
      const transaction = db.transaction(["notes"], "readwrite");
      const store = transaction.objectStore("notes");

      store.delete(Number(id));

      transaction.oncomplete = function () {
        console.log("Text deleted from the database.");
      };

      transaction.onerror = function () {
        console.error("Error deleting text.");
      };
      displayStoredTextsOffline();
    } else {
      const transaction = db.transaction(["notes"], "readwrite");
      const store = transaction.objectStore("notes");

      store.delete(Number(id));
      fetch(`https://sestilabos-s1ym.onrender.com/delete-data/${id}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((data) => {
          displayStoredTexts();
        })
        .catch((error) => console.error("Error: ", error));
    }
  }

  async function getData() {
    try {
      const response = await fetch(
        "https://sestilabos-s1ym.onrender.com/get-data"
      );

      if (!response.ok) {
        throw new Error("Error fetching data");
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Error: ", error);
      alert("Error loading data.");
    }
  }

  async function displayStoredTexts() {
    textList.innerHTML = "";

    const data = await getData();

    data.forEach((user) => {
      const listItem = document.createElement("li");
      listItem.setAttribute("id", "biljeska");
      listItem.innerHTML = `
          <span>${user.biljeska}</span>
          <button class="deleteBtn" data-id="${user.id}">Obriši</button>
        `;
      textList.appendChild(listItem);
    });
  }

  function displayStoredTextsOffline() {
    textList.innerHTML = "";
    const transaction = db.transaction(["notes"], "readonly");
    const store = transaction.objectStore("notes");
    const request = store.openCursor();

    request.onsuccess = function (event) {
      const cursor = event.target.result;

      if (cursor) {
        const listItem = document.createElement("li");
        listItem.setAttribute("id", "biljeska");
        listItem.innerHTML = `
          <span>${cursor.value.text}</span>
          <button class="deleteBtn" data-id="${cursor.value.id}">Obriši</button>
        `;
        textList.appendChild(listItem);
        cursor.continue();
      }
    };

    request.onerror = function () {
      console.error("Error fetching notes.");
    };
  }
  if (navigator.onLine) {
    addTextBtn.addEventListener("click", () => {
      const text = output_value.textContent;
      if (text) {
      }
      const podatak = {
        biljeska: text,
      };
      if (navigator.onLine) {
        fetch("/add-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(podatak),
        })
          .then((response) => response.json())
          .then((data) => {
            addTextToDB(data.data.biljeska, data.data.id);
            displayStoredTexts();
          })
          .catch((error) => {
            console.error("Error: ", error);
            alert("Error.");
          });
      }
    });
  }
  textList.addEventListener("click", (e) => {
    if (e.target && e.target.classList.contains("deleteBtn")) {
      const id = e.target.getAttribute("data-id");
      deleteTextFromDB(id);
    }
  });
  requestNotificationPermission();
  openDB();
  if (navigator.onLine) {
    displayStoredTexts();
  } else {
    displayStoredTextsOffline();
  }
});
