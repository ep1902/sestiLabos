const express = require("express");
const fs = require("fs");
const app = express();
const port = 3004;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const dataPath = "data.json";

if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify([]));
}

app.post("/add-data", (req, res) => {
  const newData = req.body;

  fs.readFile(dataPath, "utf-8", (err, fileData) => {
    if (err) {
      console.error("Error: ", err);
      return res.status(500).json({ message: "Error." });
    }

    let jsonData;
    try {
      jsonData = JSON.parse(fileData);
    } catch (parseError) {
      console.error("Error: ", parseError);
      return res.status(500).json({ message: "Error." });
    }

    const lastId = jsonData.length > 0 ? jsonData[jsonData.length - 1].id : 0;
    newData.id = lastId + 1;

    jsonData.push(newData);

    fs.writeFile(dataPath, JSON.stringify(jsonData, null, 4), (writeErr) => {
      if (writeErr) {
        console.error("Error: ", writeErr);
        return res.status(500).json({ message: "Error." });
      }

      res.status(201).json({ message: "Data added.", data: newData });
    });
  });
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/get-data", (req, res) => {
  fs.readFile(dataPath, "utf-8", (err, fileData) => {
    if (err) {
      console.error("Error: ", err);
      return res.status(500).json({ message: "Error." });
    }
    const data = JSON.parse(fileData);
    return res.status(200).json(data);
  });
});

app.delete("/delete-data/:id", async (req, res) => {
  const { id } = req.params;
  fs.readFile(dataPath, "utf-8", (err, fileData) => {
    if (err) {
      console.error("Error: ", err);
      return res.status(500).json({ message: "Error." });
    }

    let jsonData;
    try {
      jsonData = JSON.parse(fileData);
    } catch (parseError) {
      console.error("Error: ", parseError);
      return res.status(500).json({ message: "Error." });
    }

    jsonData = jsonData.filter((record) => record.id !== parseInt(id));

    fs.writeFile(dataPath, JSON.stringify(jsonData, null, 4), (writeErr) => {
      if (writeErr) {
        console.error("Error: ", writeErr);
        return res.status(500).json({ message: "Error." });
      }

      res.status(201).json({ message: "Data added" });
    });
  });
});

app.post("/api/save-texts", (req, res) => {
  const newTexts = req.body;
  var lista = [];

  newTexts.forEach((element) => {
    lista.push({ id: element.id, biljeska: element.text });
  });
  fs.writeFile(dataPath, JSON.stringify(lista, null, 4), (writeErr) => {
    if (writeErr) {
      console.error("Error: ", writeErr);
      return res.status(500).json({ message: "Error." });
    }

    res.status(201).json({ message: "Data added" });
  });
});

app.listen(port, () => {
  console.log(`Server pokrenut na http://localhost:${port}`);
});
