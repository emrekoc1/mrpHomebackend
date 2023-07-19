const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const port = 3000;


app.use(cors());
app.use(express.json());

// JSON dosyasını oku
const jsonData = fs.readFileSync('veri.json', 'utf8');
const sqlData = JSON.parse(jsonData);

// Ürün ağacını oluştur
// const createProductTree = (productId, level) => {
//     const product = sqlData.find((item) => item.kod === productId);
//     if (!product) return null;
  
//     const children = sqlData
//       .filter((item) => item.kod === product.altbom)
//       .map((item) => createProductTree(item.kod, level + 1));
  
//     return {
//       product_id: product.altbom,
//       name: product.urunadi,
//       level: level,
//       children: children.length > 0 ? children : undefined
//     };
//   };
  
//   // Tüm verileri getiren endpoint
//   app.get('/veriler', (req, res) => {
//     const productTree = createProductTree('10100205-1', 0);
//     res.json(productTree);
//   });
  app.post('/bomCek', (req, res) => {
    const { code } = req.body;
    
    function findSubcomponents(data, code, level = 0) {
      const subcomponents = [];
      for (const item of data) {
        if (item.kod === code) {
          subcomponents.push({
            level,
            bomid: item.bomid,
            kod: item.kod,
            urunadi: item.urunadi,
            altbom: item.altbom,
            miktar: item.miktar,
            birim: item.birim,
          });
          subcomponents.push(...findSubcomponents(data, item.altbom, level + 1));
        }
      }
      return subcomponents;
    }
  
    fs.readFile('veri.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        const jsonData = JSON.parse(data);
        const result = findSubcomponents(jsonData, code);
        res.json(result);
      }
    });
  });

  const siparisler = JSON.parse(fs.readFileSync('siparisler.json', 'utf8'));
  const groupAndSumSiparisler = (siparisler) => {
    const groupedSiparisler = {};
  
    siparisler.forEach((siparis) => {
      const { MALZEME_KODU, CARI, MALZEME_ACIKLAMASI, SIPARIS_ADETI, ACIK_SIPARIS, SEVKEDILEN_ADET } = siparis;
      const key = MALZEME_KODU + '-' + CARI; // Yeni bir gruplama anahtarı oluştur
      if (!groupedSiparisler[key]) {
        groupedSiparisler[key] = {
          MALZEME_KODU,
          CARI,
          MALZEME_ACIKLAMASI,
          "Toplam Sipariş Adedi": 0,
          "Toplam Açık Sipariş": 0,
          "Toplam Sevk Edilen Adet": 0
        };
      } else {
        groupedSiparisler[key]["Toplam Sipariş Adedi"] += SIPARIS_ADETI;
        groupedSiparisler[key]["Toplam Açık Sipariş"] += ACIK_SIPARIS;
        groupedSiparisler[key]["Toplam Sevk Edilen Adet"] += SEVKEDILEN_ADET;
      }
    });
  
    return Object.values(groupedSiparisler);
  };
  
  // Sipariş verilerini dönüştüren endpoint
  app.get('/siparisler', (req, res) => {
    const transformedSiparisler = groupAndSumSiparisler(siparisler);
    res.json(transformedSiparisler);
  });
  
// Belirli bir veriyi getiren endpoint
app.get('/veriler/:id', (req, res) => {
  const id = req.params.id;
  const veri = data.find(item => item.id === id);

  if (!veri) {
    res.status(404).json({ error: 'Veri bulunamadı.' });
  } else {
    res.json(veri);
  }
});

app.listen(port, () => {
  console.log(`Sunucu ${port} numaralı portta çalışıyor.`);
});
