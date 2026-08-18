const fs = require('fs');
const content = fs.readFileSync('src/data/curriculum.ts', 'utf-8');

const geoEcoHist = `
      {
        "subject": "Geography",
        "grade": 9,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Geological History and Topography of Ethiopia" },
          { "chapterNumber": 2, "chapterName": "Climate of Ethiopia" },
          { "chapterNumber": 3, "chapterName": "Natural Resource Base of Ethiopia" },
          { "chapterNumber": 4, "chapterName": "Population and Demographic Characteristics" },
          { "chapterNumber": 5, "chapterName": "Major Economic and Cultural Activities" },
          { "chapterNumber": 6, "chapterName": "Human-Natural Environment Interactions" },
          { "chapterNumber": 7, "chapterName": "Contemporary Geographic Issues" },
          { "chapterNumber": 8, "chapterName": "Geographic Inquiry Skills and Techniques" }
        ]
      },
      {
        "subject": "Geography",
        "grade": 10,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Landforms of Africa" },
          { "chapterNumber": 2, "chapterName": "Climate of Africa" },
          { "chapterNumber": 3, "chapterName": "Natural Resource Base of Africa" },
          { "chapterNumber": 4, "chapterName": "Population of Africa" },
          { "chapterNumber": 5, "chapterName": "Major Economic and Cultural Activities" },
          { "chapterNumber": 6, "chapterName": "Human-Natural Environment Interactions" },
          { "chapterNumber": 7, "chapterName": "Geographic Issues and Public Concerns" },
          { "chapterNumber": 8, "chapterName": "Geospatial Information and Data Processing" }
        ]
      },
      {
        "subject": "Geography",
        "grade": 11,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Formation of the Continents" },
          { "chapterNumber": 2, "chapterName": "Climate Classification and Regions of the World" },
          { "chapterNumber": 3, "chapterName": "Natural Resources and Conflicts Over Resources" },
          { "chapterNumber": 4, "chapterName": "Global Population Dynamics" },
          { "chapterNumber": 5, "chapterName": "Geographical Location and Economic Development" },
          { "chapterNumber": 6, "chapterName": "Major Global Environmental Changes" },
          { "chapterNumber": 7, "chapterName": "Geographic Issues and Public Concerns" },
          { "chapterNumber": 8, "chapterName": "Geospatial Information and Data Processing" }
        ]
      },
      {
        "subject": "Geography",
        "grade": 12,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Major Geological Processes and Plate Tectonics" },
          { "chapterNumber": 2, "chapterName": "Climate Change" },
          { "chapterNumber": 3, "chapterName": "Management of Conflict Over Resources" },
          { "chapterNumber": 4, "chapterName": "Population Policies and the Environment" },
          { "chapterNumber": 5, "chapterName": "Challenges of Economic Development" },
          { "chapterNumber": 6, "chapterName": "Solutions to Environmental Problems" },
          { "chapterNumber": 7, "chapterName": "Contemporary Global Geographic Issues" },
          { "chapterNumber": 8, "chapterName": "Geographical Enquiry and Map Making" }
        ]
      },
      {
        "subject": "History",
        "grade": 9,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "The Discipline of History and Human Evolution" },
          { "chapterNumber": 2, "chapterName": "Ancient World Civilizations" },
          { "chapterNumber": 3, "chapterName": "Peoples and States in Ethiopia and the Horn" },
          { "chapterNumber": 4, "chapterName": "The Middle Ages and Early Modern World" },
          { "chapterNumber": 5, "chapterName": "Peoples and States of Africa to 1500" },
          { "chapterNumber": 6, "chapterName": "Africa and the Outside World 1500-1880s" },
          { "chapterNumber": 7, "chapterName": "States and Principalities in Ethiopia" },
          { "chapterNumber": 8, "chapterName": "Political and Economic Processes in Ethiopia" },
          { "chapterNumber": 9, "chapterName": "The Age of Revolutions 1750s to 1815" }
        ]
      },
      {
        "subject": "History",
        "grade": 10,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Development of Capitalism and Nationalism 1815-1914" },
          { "chapterNumber": 2, "chapterName": "Africa and the Colonial Experience" },
          { "chapterNumber": 3, "chapterName": "Developments in Ethiopia mid 19th C to 1941" },
          { "chapterNumber": 4, "chapterName": "Society and Politics in the Age of World Wars" },
          { "chapterNumber": 5, "chapterName": "Global and Regional Developments Since 1945" },
          { "chapterNumber": 6, "chapterName": "Ethiopia Internal Developments 1941 to 1991" },
          { "chapterNumber": 7, "chapterName": "Africa Since 1960" },
          { "chapterNumber": 8, "chapterName": "Post-1991 Developments in Ethiopia" },
          { "chapterNumber": 9, "chapterName": "Indigenous Knowledge and Heritages of Ethiopia" }
        ]
      },
      {
        "subject": "History",
        "grade": 11,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "History Historiography and Human Evolution" },
          { "chapterNumber": 2, "chapterName": "Ancient World Civilizations up to 500 AD" },
          { "chapterNumber": 3, "chapterName": "Peoples States in Ethiopia and the Horn" },
          { "chapterNumber": 4, "chapterName": "The Middle Ages and Early Modern World" },
          { "chapterNumber": 5, "chapterName": "Peoples and States of Africa to 1500" },
          { "chapterNumber": 6, "chapterName": "Africa and the Outside World 1500-1880s" },
          { "chapterNumber": 7, "chapterName": "States and Principalities in Ethiopia" },
          { "chapterNumber": 8, "chapterName": "Political and Economic Processes in Ethiopia" },
          { "chapterNumber": 9, "chapterName": "The Age of Revolutions 1789 to 1815" }
        ]
      },
      {
        "subject": "History",
        "grade": 12,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Development of Capitalism and Nationalism 1815-1914" },
          { "chapterNumber": 2, "chapterName": "Africa and the Colonial Experience 1880s-1960s" },
          { "chapterNumber": 3, "chapterName": "Developments in Ethiopia Mid 19th C to 1941" },
          { "chapterNumber": 4, "chapterName": "Society and Politics in the Age of World Wars" },
          { "chapterNumber": 5, "chapterName": "Global and Regional Developments Since 1945" },
          { "chapterNumber": 6, "chapterName": "Ethiopia Internal Developments 1941 to 1991" },
          { "chapterNumber": 7, "chapterName": "Africa Since the 1960s" },
          { "chapterNumber": 8, "chapterName": "Post 1991 Developments in Ethiopia" },
          { "chapterNumber": 9, "chapterName": "Indigenous Knowledge Systems and Heritages" }
        ]
      },
      {
        "subject": "Economics",
        "grade": 9,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Introducing Economics" },
          { "chapterNumber": 2, "chapterName": "Basic Economic Problems and Systems" },
          { "chapterNumber": 3, "chapterName": "Economic Resources and Markets" },
          { "chapterNumber": 4, "chapterName": "Introduction to Demand and Supply" },
          { "chapterNumber": 5, "chapterName": "Introduction to Production and Cost" },
          { "chapterNumber": 6, "chapterName": "Introduction to Money" },
          { "chapterNumber": 7, "chapterName": "Introduction to Macroeconomics" },
          { "chapterNumber": 8, "chapterName": "Basic Entrepreneurship" }
        ]
      },
      {
        "subject": "Economics",
        "grade": 10,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Theory of Consumer Behaviour" },
          { "chapterNumber": 2, "chapterName": "Theories of Demand and Supply" },
          { "chapterNumber": 3, "chapterName": "Theories of Production and Cost" },
          { "chapterNumber": 4, "chapterName": "Market Structure" },
          { "chapterNumber": 5, "chapterName": "Banking and Finance" },
          { "chapterNumber": 6, "chapterName": "Economic Growth" },
          { "chapterNumber": 7, "chapterName": "The Ethiopian Economy" },
          { "chapterNumber": 8, "chapterName": "Business Startups and Innovation" }
        ]
      },
      {
        "subject": "Economics",
        "grade": 11,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Theory of Consumer Behavior and Demand" },
          { "chapterNumber": 2, "chapterName": "Market Structure and Firms" },
          { "chapterNumber": 3, "chapterName": "National Income Accounting" },
          { "chapterNumber": 4, "chapterName": "Consumption Saving and Investment" },
          { "chapterNumber": 5, "chapterName": "Trade and Finance" },
          { "chapterNumber": 6, "chapterName": "Economic Development" },
          { "chapterNumber": 7, "chapterName": "Sectors and Policies of Ethiopia" }
        ]
      },
      {
        "subject": "Economics",
        "grade": 12,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Fundamental Concepts of Macroeconomics" },
          { "chapterNumber": 2, "chapterName": "Aggregate Demand and Supply" },
          { "chapterNumber": 3, "chapterName": "Market Failure and Consumer Protection" },
          { "chapterNumber": 4, "chapterName": "Macroeconomic Policy Instruments" },
          { "chapterNumber": 5, "chapterName": "Tax Theory and Practice" },
          { "chapterNumber": 6, "chapterName": "Poverty and Inequality" },
          { "chapterNumber": 7, "chapterName": "Macroeconomic Reforms in Ethiopia" },
          { "chapterNumber": 8, "chapterName": "Economy Environment and Climate Change" }
        ]
      },`;

const idx = content.indexOf('"subject": "Maths"');
const newContent = content.slice(0, idx) + geoEcoHist.substring(1) + '\r\n      ' + content.slice(idx - 8); // -8 to include "      {\r\n"

fs.writeFileSync('src/data/curriculum.ts', newContent, 'utf-8');
console.log('Done. Lines:', newContent.split('\n').length);