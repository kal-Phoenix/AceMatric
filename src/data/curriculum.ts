// Ethiopian Grade 9-12 Curriculum parsed from the official Google Sheet
// Generated automatically for late-use matching

export interface ChapterInfo {
  chapterNumber: number;
  chapterName: string;
}

export interface SubjectCurriculum {
  subject: string;
  grade: number;
  chapters: ChapterInfo[];
}

export interface StreamCurriculum {
  stream: 'Natural' | 'Social';
  subjects: SubjectCurriculum[];
}

export const ETHIOPIAN_CURRICULUM: StreamCurriculum[] = [
  {
    "stream": "Natural",
    "subjects": [
      {
        "subject": "Biology",
        "grade": 9,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Introduction to Biology" },
          { "chapterNumber": 2, "chapterName": "Characteristics and Classification of Organisms" },
          { "chapterNumber": 3, "chapterName": "Cells" },
          { "chapterNumber": 4, "chapterName": "Reproduction" },
          { "chapterNumber": 5, "chapterName": "Human Health, Nutrition, and Disease" },
          { "chapterNumber": 6, "chapterName": "Ecology" }
        ]
      },
      {
        "subject": "Biology",
        "grade": 10,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Sub Fields of Biology" },
          { "chapterNumber": 2, "chapterName": "Plants" },
          { "chapterNumber": 3, "chapterName": "Biochemical Molecules" },
          { "chapterNumber": 4, "chapterName": "Cell Reproduction" },
          { "chapterNumber": 5, "chapterName": "Human Biology" },
          { "chapterNumber": 6, "chapterName": "Ecological Interaction" }
        ]
      },
      {
        "subject": "Biology",
        "grade": 11,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Biology and Technology" },
          { "chapterNumber": 2, "chapterName": "Animals" },
          { "chapterNumber": 3, "chapterName": "Enzymes" },
          { "chapterNumber": 4, "chapterName": "Genetics" },
          { "chapterNumber": 5, "chapterName": "The Human Body Systems" },
          { "chapterNumber": 6, "chapterName": "Population and Natural Resources" }
        ]
      },
      {
        "subject": "Biology",
        "grade": 12,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Application of Biology" },
          { "chapterNumber": 2, "chapterName": "Microorganisms" },
          { "chapterNumber": 3, "chapterName": "Energy Transformation" },
          { "chapterNumber": 4, "chapterName": "Evolution" },
          { "chapterNumber": 5, "chapterName": "Human Body System" },
          { "chapterNumber": 6, "chapterName": "Climate Change" }
        ]
      },
      {
        "subject": "Chemistry",
        "grade": 9,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Chemistry and Its Importance" },
          { "chapterNumber": 2, "chapterName": "Measurements and Scientific Methods" },
          { "chapterNumber": 3, "chapterName": "Structure of the Atom" },
          { "chapterNumber": 4, "chapterName": "Periodic Classification of Elements" },
          { "chapterNumber": 5, "chapterName": "Chemical Bonding" }
        ]
      },
      {
        "subject": "Chemistry",
        "grade": 10,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Chemical Reactions and Stoichiometry" },
          { "chapterNumber": 2, "chapterName": "Solutions" },
          { "chapterNumber": 3, "chapterName": "Important Inorganic Compounds" },
          { "chapterNumber": 4, "chapterName": "Energy Changes and Electrochemistry" },
          { "chapterNumber": 5, "chapterName": "Metals and Nonmetals" },
          { "chapterNumber": 6, "chapterName": "Hydrocarbons and Their Natural Sources" }
        ]
      },
      {
        "subject": "Chemistry",
        "grade": 11,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Atomic Structure and Periodic Properties of the Elements" },
          { "chapterNumber": 2, "chapterName": "Chemical Bonding" },
          { "chapterNumber": 3, "chapterName": "Physical States of Matter" },
          { "chapterNumber": 4, "chapterName": "Chemical Kinetics" },
          { "chapterNumber": 5, "chapterName": "Chemical Equilibrium" },
          { "chapterNumber": 6, "chapterName": "Some Important Oxygen-Containing Organic Compounds" }
        ]
      },
      {
        "subject": "Chemistry",
        "grade": 12,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Acid-Base Equilibria" },
          { "chapterNumber": 2, "chapterName": "Electrochemistry" },
          { "chapterNumber": 3, "chapterName": "Industrial Chemistry" },
          { "chapterNumber": 4, "chapterName": "Polymers" },
          { "chapterNumber": 5, "chapterName": "Introduction to Environmental Chemistry" }
        ]
      },
      {
        "subject": "Physics",
        "grade": 9,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Physics and Human Society" },
          { "chapterNumber": 2, "chapterName": "Physical Quantities" },
          { "chapterNumber": 3, "chapterName": "Motion in a Straight Line" },
          { "chapterNumber": 4, "chapterName": "Force, Work, Energy and Power" },
          { "chapterNumber": 5, "chapterName": "Simple Machines" },
          { "chapterNumber": 6, "chapterName": "Mechanical Oscillations and Sound Waves" }
        ]
      },
      {
        "subject": "Physics",
        "grade": 10,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Vector Quantities" },
          { "chapterNumber": 2, "chapterName": "Uniformly Accelerated Motion" },
          { "chapterNumber": 3, "chapterName": "Elasticity and Static Equilibrium of Rigid Body" },
          { "chapterNumber": 4, "chapterName": "Static and Current Electricity" },
          { "chapterNumber": 5, "chapterName": "Magnetism" },
          { "chapterNumber": 6, "chapterName": "Electromagnetic Waves and Geometrical Optics" }
        ]
      },
      {
        "subject": "Physics",
        "grade": 11,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Physics and Human Society" },
          { "chapterNumber": 2, "chapterName": "Vectors" },
          { "chapterNumber": 3, "chapterName": "Motion in One and Two Dimensions" },
          { "chapterNumber": 4, "chapterName": "Dynamics" },
          { "chapterNumber": 5, "chapterName": "Heat Conduction and Calorimetry" },
          { "chapterNumber": 6, "chapterName": "Electrostatics and Electric Circuit" },
          { "chapterNumber": 7, "chapterName": "Nuclear Physics" }
        ]
      },
      {
        "subject": "Physics",
        "grade": 12,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Application of Physics in Other Fields" },
          { "chapterNumber": 2, "chapterName": "Two-Dimensional Motion" },
          { "chapterNumber": 3, "chapterName": "Fluid Mechanics" },
          { "chapterNumber": 4, "chapterName": "Electromagnetism" },
          { "chapterNumber": 5, "chapterName": "Basics of Electronics" }
        ]
      },
      {
        "subject": "Maths",
        "grade": 9,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Further on Sets" },
          { "chapterNumber": 2, "chapterName": "The Number System" },
          { "chapterNumber": 3, "chapterName": "Solving Equations" },
          { "chapterNumber": 4, "chapterName": "Solving Inequalities" },
          { "chapterNumber": 5, "chapterName": "Introduction to Trigonometry" },
          { "chapterNumber": 6, "chapterName": "Regular Polygons" },
          { "chapterNumber": 7, "chapterName": "Congruency and Similarity" },
          { "chapterNumber": 8, "chapterName": "Vectors in Two Dimensions" },
          { "chapterNumber": 9, "chapterName": "Statistics and Probability" }
        ]
      },
      {
        "subject": "Maths",
        "grade": 10,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Relations and Functions" },
          { "chapterNumber": 2, "chapterName": "Polynomial Functions" },
          { "chapterNumber": 3, "chapterName": "Exponential and Logarithmic Functions" },
          { "chapterNumber": 4, "chapterName": "Trigonometric Functions" },
          { "chapterNumber": 5, "chapterName": "Circles" },
          { "chapterNumber": 6, "chapterName": "Solid Figures" },
          { "chapterNumber": 7, "chapterName": "Coordinate Geometry" }
        ]
      },
      {
        "subject": "Maths",
        "grade": 11,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Relations and Functions" },
          { "chapterNumber": 2, "chapterName": "Rational Expressions and Rational Functions" },
          { "chapterNumber": 3, "chapterName": "Matrices" },
          { "chapterNumber": 4, "chapterName": "Determinants and Their Properties" },
          { "chapterNumber": 5, "chapterName": "Vectors" },
          { "chapterNumber": 6, "chapterName": "Transformation of a Plane" },
          { "chapterNumber": 7, "chapterName": "Statistics" },
          { "chapterNumber": 8, "chapterName": "Probability" }
        ]
      },
      {
        "subject": "Maths",
        "grade": 12,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Sequence and Series" },
          { "chapterNumber": 2, "chapterName": "Introduction to Calculus" },
          { "chapterNumber": 3, "chapterName": "Statistics" },
          { "chapterNumber": 4, "chapterName": "Introduction to Linear Programming" },
          { "chapterNumber": 5, "chapterName": "Mathematical Application in Business" }
        ]
      },
      {
        "subject": "English",
        "grade": 9,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Living in Urban Areas" },
          { "chapterNumber": 2, "chapterName": "Study Skills" },
          { "chapterNumber": 3, "chapterName": "Traffic Accident" },
          { "chapterNumber": 4, "chapterName": "National Parks" },
          { "chapterNumber": 5, "chapterName": "Horticulture" },
          { "chapterNumber": 6, "chapterName": "Poverty in Ethiopia" },
          { "chapterNumber": 7, "chapterName": "Community Services" },
          { "chapterNumber": 8, "chapterName": "Communicable Diseases" },
          { "chapterNumber": 9, "chapterName": "Fairness and Equity" },
          { "chapterNumber": 10, "chapterName": "The Internet" }
        ]
      },
      {
        "subject": "English",
        "grade": 10,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Population Growth" },
          { "chapterNumber": 2, "chapterName": "Travel Behaviour" },
          { "chapterNumber": 3, "chapterName": "Punctuality" },
          { "chapterNumber": 4, "chapterName": "Tourist Attractions" },
          { "chapterNumber": 5, "chapterName": "Honey Processing" },
          { "chapterNumber": 6, "chapterName": "Migration" },
          { "chapterNumber": 7, "chapterName": "Branding Ethiopia and National Identity" },
          { "chapterNumber": 8, "chapterName": "The Healing Power of Plants" },
          { "chapterNumber": 9, "chapterName": "Multilingualism" },
          { "chapterNumber": 10, "chapterName": "Digital Vs Satellite Television" }
        ]
      },
      {
        "subject": "English",
        "grade": 11,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Environmental Hazards" },
          { "chapterNumber": 2, "chapterName": "Civilization" },
          { "chapterNumber": 3, "chapterName": "Causes of Road Traffic Accidents" },
          { "chapterNumber": 4, "chapterName": "People and Natural Resources" },
          { "chapterNumber": 5, "chapterName": "Irrigation" },
          { "chapterNumber": 6, "chapterName": "Global Warming" },
          { "chapterNumber": 7, "chapterName": "Patriotism" },
          { "chapterNumber": 8, "chapterName": "Efficiency of Health Services" },
          { "chapterNumber": 9, "chapterName": "Indigenous Conflict Resolution" },
          { "chapterNumber": 10, "chapterName": "Artificial Intelligence" }
        ]
      },
      {
        "subject": "English",
        "grade": 12,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Sustainable Development" },
          { "chapterNumber": 2, "chapterName": "Time Management" },
          { "chapterNumber": 3, "chapterName": "Evidence on Traffic Accident" },
          { "chapterNumber": 4, "chapterName": "Natural Resource Management" },
          { "chapterNumber": 5, "chapterName": "Mechanized Agriculture" },
          { "chapterNumber": 6, "chapterName": "Green Economies" },
          { "chapterNumber": 7, "chapterName": "National Pride" },
          { "chapterNumber": 8, "chapterName": "Telemedicine" },
          { "chapterNumber": 9, "chapterName": "Conflict Management" },
          { "chapterNumber": 10, "chapterName": "Robotics" }
        ]
      },
      {
        "subject": "SAT",
        "grade": 9,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Numbers and Operations" },
          { "chapterNumber": 2, "chapterName": "Algebra and Functions" },
          { "chapterNumber": 3, "chapterName": "Geometry and Measurement" },
          { "chapterNumber": 4, "chapterName": "Data Analysis and Probability" },
          { "chapterNumber": 5, "chapterName": "Advanced Mathematics" },
          { "chapterNumber": 6, "chapterName": "Problem Solving Strategies" },
          { "chapterNumber": 7, "chapterName": "Critical Reading" },
          { "chapterNumber": 8, "chapterName": "Writing and Language" },
          { "chapterNumber": 9, "chapterName": "Essay Writing" },
          { "chapterNumber": 10, "chapterName": "Vocabulary in Context" },
          { "chapterNumber": 11, "chapterName": "Informational Graphics" },
          { "chapterNumber": 12, "chapterName": "Evidence-Based Reasoning" },
          { "chapterNumber": 13, "chapterName": "Pairs of Quantities" },
          { "chapterNumber": 14, "chapterName": "Ratios and Proportional Relationships" },
          { "chapterNumber": 15, "chapterName": "Percentage and Percent Change" },
          { "chapterNumber": 16, "chapterName": "Data Interpretation" },
          { "chapterNumber": 17, "chapterName": "Science Passage Analysis" },
          { "chapterNumber": 18, "chapterName": "Social Science Passage Analysis" },
          { "chapterNumber": 19, "chapterName": "Historical Passage Analysis" },
          { "chapterNumber": 20, "chapterName": "Literary Passage Analysis" },
          { "chapterNumber": 21, "chapterName": "Writing Revision" },
          { "chapterNumber": 22, "chapterName": "Idioms and Common Expressions" }
        ]
      },
      {
        "subject": "SAT",
        "grade": 10,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Numbers and Operations" },
          { "chapterNumber": 2, "chapterName": "Algebra and Functions" },
          { "chapterNumber": 3, "chapterName": "Geometry and Measurement" },
          { "chapterNumber": 4, "chapterName": "Data Analysis and Probability" },
          { "chapterNumber": 5, "chapterName": "Advanced Mathematics" },
          { "chapterNumber": 6, "chapterName": "Problem Solving Strategies" },
          { "chapterNumber": 7, "chapterName": "Critical Reading" },
          { "chapterNumber": 8, "chapterName": "Writing and Language" },
          { "chapterNumber": 9, "chapterName": "Essay Writing" },
          { "chapterNumber": 10, "chapterName": "Vocabulary in Context" },
          { "chapterNumber": 11, "chapterName": "Informational Graphics" },
          { "chapterNumber": 12, "chapterName": "Evidence-Based Reasoning" },
          { "chapterNumber": 13, "chapterName": "Pairs of Quantities" },
          { "chapterNumber": 14, "chapterName": "Ratios and Proportional Relationships" },
          { "chapterNumber": 15, "chapterName": "Percentage and Percent Change" },
          { "chapterNumber": 16, "chapterName": "Data Interpretation" },
          { "chapterNumber": 17, "chapterName": "Science Passage Analysis" },
          { "chapterNumber": 18, "chapterName": "Social Science Passage Analysis" },
          { "chapterNumber": 19, "chapterName": "Historical Passage Analysis" },
          { "chapterNumber": 20, "chapterName": "Literary Passage Analysis" },
          { "chapterNumber": 21, "chapterName": "Writing Revision" },
          { "chapterNumber": 22, "chapterName": "Idioms and Common Expressions" }
        ]
      },
      {
        "subject": "SAT",
        "grade": 11,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Numbers and Operations" },
          { "chapterNumber": 2, "chapterName": "Algebra and Functions" },
          { "chapterNumber": 3, "chapterName": "Geometry and Measurement" },
          { "chapterNumber": 4, "chapterName": "Data Analysis and Probability" },
          { "chapterNumber": 5, "chapterName": "Advanced Mathematics" },
          { "chapterNumber": 6, "chapterName": "Problem Solving Strategies" },
          { "chapterNumber": 7, "chapterName": "Critical Reading" },
          { "chapterNumber": 8, "chapterName": "Writing and Language" },
          { "chapterNumber": 9, "chapterName": "Essay Writing" },
          { "chapterNumber": 10, "chapterName": "Vocabulary in Context" },
          { "chapterNumber": 11, "chapterName": "Informational Graphics" },
          { "chapterNumber": 12, "chapterName": "Evidence-Based Reasoning" },
          { "chapterNumber": 13, "chapterName": "Pairs of Quantities" },
          { "chapterNumber": 14, "chapterName": "Ratios and Proportional Relationships" },
          { "chapterNumber": 15, "chapterName": "Percentage and Percent Change" },
          { "chapterNumber": 16, "chapterName": "Data Interpretation" },
          { "chapterNumber": 17, "chapterName": "Science Passage Analysis" },
          { "chapterNumber": 18, "chapterName": "Social Science Passage Analysis" },
          { "chapterNumber": 19, "chapterName": "Historical Passage Analysis" },
          { "chapterNumber": 20, "chapterName": "Literary Passage Analysis" },
          { "chapterNumber": 21, "chapterName": "Writing Revision" },
          { "chapterNumber": 22, "chapterName": "Idioms and Common Expressions" }
        ]
      },
      {
        "subject": "SAT",
        "grade": 12,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Numbers and Operations" },
          { "chapterNumber": 2, "chapterName": "Algebra and Functions" },
          { "chapterNumber": 3, "chapterName": "Geometry and Measurement" },
          { "chapterNumber": 4, "chapterName": "Data Analysis and Probability" },
          { "chapterNumber": 5, "chapterName": "Advanced Mathematics" },
          { "chapterNumber": 6, "chapterName": "Problem Solving Strategies" },
          { "chapterNumber": 7, "chapterName": "Critical Reading" },
          { "chapterNumber": 8, "chapterName": "Writing and Language" },
          { "chapterNumber": 9, "chapterName": "Essay Writing" },
          { "chapterNumber": 10, "chapterName": "Vocabulary in Context" },
          { "chapterNumber": 11, "chapterName": "Informational Graphics" },
          { "chapterNumber": 12, "chapterName": "Evidence-Based Reasoning" },
          { "chapterNumber": 13, "chapterName": "Pairs of Quantities" },
          { "chapterNumber": 14, "chapterName": "Ratios and Proportional Relationships" },
          { "chapterNumber": 15, "chapterName": "Percentage and Percent Change" },
          { "chapterNumber": 16, "chapterName": "Data Interpretation" },
          { "chapterNumber": 17, "chapterName": "Science Passage Analysis" },
          { "chapterNumber": 18, "chapterName": "Social Science Passage Analysis" },
          { "chapterNumber": 19, "chapterName": "Historical Passage Analysis" },
          { "chapterNumber": 20, "chapterName": "Literary Passage Analysis" },
          { "chapterNumber": 21, "chapterName": "Writing Revision" },
          { "chapterNumber": 22, "chapterName": "Idioms and Common Expressions" }
        ]
      }
    ]
  },
  {
    "stream": "Social",
    "subjects": [
      {
        "subject": "Geography",
        "grade": 9,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Geological History and Topography of Ethiopia" },
          { "chapterNumber": 2, "chapterName": "Climate of Ethiopia" },
          { "chapterNumber": 3, "chapterName": "Natural Resource Base of Ethiopia" },
          { "chapterNumber": 4, "chapterName": "Population and Demographic Characteristics of Ethiopia" },
          { "chapterNumber": 5, "chapterName": "Major Economic and Cultural Activities in Ethiopia" },
          { "chapterNumber": 6, "chapterName": "Human-Natural Environment Interactions in Ethiopia" },
          { "chapterNumber": 7, "chapterName": "Contemporary Geographic Issues and Public Concerns in Ethiopia" },
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
          { "chapterNumber": 5, "chapterName": "Major Economic and Cultural Activities of Africa" },
          { "chapterNumber": 6, "chapterName": "Human-Natural Environment Interactions" },
          { "chapterNumber": 7, "chapterName": "Geographic Issues and Public Concerns in Africa" },
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
          { "chapterNumber": 4, "chapterName": "Global Population Dynamics and Changes" },
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
          { "chapterNumber": 1, "chapterName": "Major Geological Processes Associated with Plate Tectonics" },
          { "chapterNumber": 2, "chapterName": "Climate Change" },
          { "chapterNumber": 3, "chapterName": "Management of Conflict Over Resources" },
          { "chapterNumber": 4, "chapterName": "Population Policies, Programs and the Environment" },
          { "chapterNumber": 5, "chapterName": "Challenges of Economic Development" },
          { "chapterNumber": 6, "chapterName": "Solutions to Environmental and Sustainability Problems" },
          { "chapterNumber": 7, "chapterName": "Contemporary Global Geographic Issues and Public Concerns" },
          { "chapterNumber": 8, "chapterName": "Geographical Enquiry and Map Making" }
        ]
      },
      {
        "subject": "History",
        "grade": 9,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "The Discipline of History and Human Evolution" },
          { "chapterNumber": 2, "chapterName": "Ancient World Civilizations up to c. 500 AD" },
          { "chapterNumber": 3, "chapterName": "Peoples and States in Ethiopia and the Horn to the End of 13th C" },
          { "chapterNumber": 4, "chapterName": "The Middle Ages and Early Modern World, c. 500 to 1750s" },
          { "chapterNumber": 5, "chapterName": "Peoples and States of Africa to 1500" },
          { "chapterNumber": 6, "chapterName": "Africa and the Outside World 1500-1880s" },
          { "chapterNumber": 7, "chapterName": "States, Principalities, Population Movements and Interactions in Ethiopia 13th to Mid-16th C" },
          { "chapterNumber": 8, "chapterName": "Political, Social and Economic Processes in Ethiopia Mid-16th to Mid-19th C" },
          { "chapterNumber": 9, "chapterName": "The Age of Revolutions 1750s to 1815" }
        ]
      },
      {
        "subject": "History",
        "grade": 10,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Development of Capitalism and Nationalism 1815-1914" },
          { "chapterNumber": 2, "chapterName": "Africa and the Colonial Experience (1880s-1960s)" },
          { "chapterNumber": 3, "chapterName": "Social, Economic and Political Developments in Ethiopia mid 19th C to 1941" },
          { "chapterNumber": 4, "chapterName": "Society and Politics in the Age of World Wars 1914-1945" },
          { "chapterNumber": 5, "chapterName": "Global and Regional Developments Since 1945" },
          { "chapterNumber": 6, "chapterName": "Ethiopia: Internal Developments and External Influences from 1941 to 1991" },
          { "chapterNumber": 7, "chapterName": "Africa Since 1960" },
          { "chapterNumber": 8, "chapterName": "Post-1991 Developments in Ethiopia" },
          { "chapterNumber": 9, "chapterName": "Indigenous Knowledge and Heritages of Ethiopia" }
        ]
      },
      {
        "subject": "History",
        "grade": 11,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "History, Historiography, and Human Evolution" },
          { "chapterNumber": 2, "chapterName": "Major Spots of Ancient World Civilizations Up to c.500 A.D" },
          { "chapterNumber": 3, "chapterName": "Peoples, States and Historical Processes in Ethiopia and the Horn to the End of the 13th Century" },
          { "chapterNumber": 4, "chapterName": "The Middle Ages and Early Modern World, c. 500 AD-1789" },
          { "chapterNumber": 5, "chapterName": "Peoples and States of Africa to 1500" },
          { "chapterNumber": 6, "chapterName": "Africa and the Outside World: 1500-1880s" },
          { "chapterNumber": 7, "chapterName": "States, Principalities, Population Movements and Interactions in Ethiopia" },
          { "chapterNumber": 8, "chapterName": "Political, Social and Economic Processes in Ethiopia, Mid 16th to Mid-19th Century" },
          { "chapterNumber": 9, "chapterName": "The Age of Revolutions, 1789 to 1815" }
        ]
      },
      {
        "subject": "History",
        "grade": 12,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Development of Capitalism and Nationalism from 1815 to 1914" },
          { "chapterNumber": 2, "chapterName": "Africa and the Colonial Experience (1880s-1960s)" },
          { "chapterNumber": 3, "chapterName": "Social, Economic and Political Developments in Ethiopia, Mid 19th C. to 1941" },
          { "chapterNumber": 4, "chapterName": "Society and Politics in the Age of World Wars, 1914-1945" },
          { "chapterNumber": 5, "chapterName": "Global and Regional Developments Since 1945" },
          { "chapterNumber": 6, "chapterName": "Ethiopia: Internal Developments and External Influences from 1941 to 1991" },
          { "chapterNumber": 7, "chapterName": "Africa Since the 1960s" },
          { "chapterNumber": 8, "chapterName": "Post 1991 Developments in Ethiopia" },
          { "chapterNumber": 9, "chapterName": "Indigenous Knowledge Systems and Heritages of Ethiopia" }
        ]
      },
      {
        "subject": "Economics",
        "grade": 9,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Introducing Economics" },
          { "chapterNumber": 2, "chapterName": "The Basic Economic Problems and Economic Systems" },
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
          { "chapterNumber": 2, "chapterName": "Market Structure and the Decision of Firms" },
          { "chapterNumber": 3, "chapterName": "National Income Accounting" },
          { "chapterNumber": 4, "chapterName": "Consumption, Saving and Investment" },
          { "chapterNumber": 5, "chapterName": "Trade and Finance" },
          { "chapterNumber": 6, "chapterName": "Economic Development" },
          { "chapterNumber": 7, "chapterName": "Main Sectors, Sectorial Policies and Strategies of Ethiopia" }
        ]
      },
      {
        "subject": "Economics",
        "grade": 12,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Introduction to Economics" },
          { "chapterNumber": 2, "chapterName": "Aggregate Demand and Aggregate Supply Analysis" },
          { "chapterNumber": 3, "chapterName": "Market Failure and Consumer Protection" },
          { "chapterNumber": 4, "chapterName": "Macroeconomic Policy Instruments" },
          { "chapterNumber": 5, "chapterName": "Tax Theory and Practice" },
          { "chapterNumber": 6, "chapterName": "Poverty and Inequality" },
          { "chapterNumber": 7, "chapterName": "Macroeconomic Reforms in Ethiopia" },
          { "chapterNumber": 8, "chapterName": "Economy, Environment and Climate Change" }
        ]
      },
      {
        "subject": "English",
        "grade": 9,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Living in Urban Areas" },
          { "chapterNumber": 2, "chapterName": "Study Skills" },
          { "chapterNumber": 3, "chapterName": "Traffic Accident" },
          { "chapterNumber": 4, "chapterName": "National Parks" },
          { "chapterNumber": 5, "chapterName": "Horticulture" },
          { "chapterNumber": 6, "chapterName": "Poverty in Ethiopia" },
          { "chapterNumber": 7, "chapterName": "Community Services" },
          { "chapterNumber": 8, "chapterName": "Communicable Diseases" },
          { "chapterNumber": 9, "chapterName": "Fairness and Equity" },
          { "chapterNumber": 10, "chapterName": "The Internet" }
        ]
      },
      {
        "subject": "English",
        "grade": 10,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Population Growth" },
          { "chapterNumber": 2, "chapterName": "Travel Behaviour" },
          { "chapterNumber": 3, "chapterName": "Punctuality" },
          { "chapterNumber": 4, "chapterName": "Tourist Attractions" },
          { "chapterNumber": 5, "chapterName": "Honey Processing" },
          { "chapterNumber": 6, "chapterName": "Migration" },
          { "chapterNumber": 7, "chapterName": "Branding Ethiopia and National Identity" },
          { "chapterNumber": 8, "chapterName": "The Healing Power of Plants" },
          { "chapterNumber": 9, "chapterName": "Multilingualism" },
          { "chapterNumber": 10, "chapterName": "Digital Vs Satellite Television" }
        ]
      },
      {
        "subject": "English",
        "grade": 11,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Environmental Hazards" },
          { "chapterNumber": 2, "chapterName": "Civilization" },
          { "chapterNumber": 3, "chapterName": "Causes of Road Traffic Accidents" },
          { "chapterNumber": 4, "chapterName": "People and Natural Resources" },
          { "chapterNumber": 5, "chapterName": "Irrigation" },
          { "chapterNumber": 6, "chapterName": "Global Warming" },
          { "chapterNumber": 7, "chapterName": "Patriotism" },
          { "chapterNumber": 8, "chapterName": "Efficiency of Health Services" },
          { "chapterNumber": 9, "chapterName": "Indigenous Conflict Resolution" },
          { "chapterNumber": 10, "chapterName": "Artificial Intelligence" }
        ]
      },
      {
        "subject": "English",
        "grade": 12,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Sustainable Development" },
          { "chapterNumber": 2, "chapterName": "Time Management" },
          { "chapterNumber": 3, "chapterName": "Evidence on Traffic Accident" },
          { "chapterNumber": 4, "chapterName": "Natural Resource Management" },
          { "chapterNumber": 5, "chapterName": "Mechanized Agriculture" },
          { "chapterNumber": 6, "chapterName": "Green Economies" },
          { "chapterNumber": 7, "chapterName": "National Pride" },
          { "chapterNumber": 8, "chapterName": "Telemedicine" },
          { "chapterNumber": 9, "chapterName": "Conflict Management" },
          { "chapterNumber": 10, "chapterName": "Robotics" }
        ]
      },
      {
        "subject": "SAT",
        "grade": 9,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Numbers and Operations" },
          { "chapterNumber": 2, "chapterName": "Algebra and Functions" },
          { "chapterNumber": 3, "chapterName": "Geometry and Measurement" },
          { "chapterNumber": 4, "chapterName": "Data Analysis and Probability" },
          { "chapterNumber": 5, "chapterName": "Advanced Mathematics" },
          { "chapterNumber": 6, "chapterName": "Problem Solving Strategies" },
          { "chapterNumber": 7, "chapterName": "Critical Reading" },
          { "chapterNumber": 8, "chapterName": "Writing and Language" },
          { "chapterNumber": 9, "chapterName": "Essay Writing" },
          { "chapterNumber": 10, "chapterName": "Vocabulary in Context" },
          { "chapterNumber": 11, "chapterName": "Informational Graphics" },
          { "chapterNumber": 12, "chapterName": "Evidence-Based Reasoning" },
          { "chapterNumber": 13, "chapterName": "Pairs of Quantities" },
          { "chapterNumber": 14, "chapterName": "Ratios and Proportional Relationships" },
          { "chapterNumber": 15, "chapterName": "Percentage and Percent Change" },
          { "chapterNumber": 16, "chapterName": "Data Interpretation" },
          { "chapterNumber": 17, "chapterName": "Science Passage Analysis" },
          { "chapterNumber": 18, "chapterName": "Social Science Passage Analysis" },
          { "chapterNumber": 19, "chapterName": "Historical Passage Analysis" },
          { "chapterNumber": 20, "chapterName": "Literary Passage Analysis" },
          { "chapterNumber": 21, "chapterName": "Writing Revision" },
          { "chapterNumber": 22, "chapterName": "Idioms and Common Expressions" }
        ]
      },
      {
        "subject": "SAT",
        "grade": 10,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Numbers and Operations" },
          { "chapterNumber": 2, "chapterName": "Algebra and Functions" },
          { "chapterNumber": 3, "chapterName": "Geometry and Measurement" },
          { "chapterNumber": 4, "chapterName": "Data Analysis and Probability" },
          { "chapterNumber": 5, "chapterName": "Advanced Mathematics" },
          { "chapterNumber": 6, "chapterName": "Problem Solving Strategies" },
          { "chapterNumber": 7, "chapterName": "Critical Reading" },
          { "chapterNumber": 8, "chapterName": "Writing and Language" },
          { "chapterNumber": 9, "chapterName": "Essay Writing" },
          { "chapterNumber": 10, "chapterName": "Vocabulary in Context" },
          { "chapterNumber": 11, "chapterName": "Informational Graphics" },
          { "chapterNumber": 12, "chapterName": "Evidence-Based Reasoning" },
          { "chapterNumber": 13, "chapterName": "Pairs of Quantities" },
          { "chapterNumber": 14, "chapterName": "Ratios and Proportional Relationships" },
          { "chapterNumber": 15, "chapterName": "Percentage and Percent Change" },
          { "chapterNumber": 16, "chapterName": "Data Interpretation" },
          { "chapterNumber": 17, "chapterName": "Science Passage Analysis" },
          { "chapterNumber": 18, "chapterName": "Social Science Passage Analysis" },
          { "chapterNumber": 19, "chapterName": "Historical Passage Analysis" },
          { "chapterNumber": 20, "chapterName": "Literary Passage Analysis" },
          { "chapterNumber": 21, "chapterName": "Writing Revision" },
          { "chapterNumber": 22, "chapterName": "Idioms and Common Expressions" }
        ]
      },
      {
        "subject": "SAT",
        "grade": 11,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Numbers and Operations" },
          { "chapterNumber": 2, "chapterName": "Algebra and Functions" },
          { "chapterNumber": 3, "chapterName": "Geometry and Measurement" },
          { "chapterNumber": 4, "chapterName": "Data Analysis and Probability" },
          { "chapterNumber": 5, "chapterName": "Advanced Mathematics" },
          { "chapterNumber": 6, "chapterName": "Problem Solving Strategies" },
          { "chapterNumber": 7, "chapterName": "Critical Reading" },
          { "chapterNumber": 8, "chapterName": "Writing and Language" },
          { "chapterNumber": 9, "chapterName": "Essay Writing" },
          { "chapterNumber": 10, "chapterName": "Vocabulary in Context" },
          { "chapterNumber": 11, "chapterName": "Informational Graphics" },
          { "chapterNumber": 12, "chapterName": "Evidence-Based Reasoning" },
          { "chapterNumber": 13, "chapterName": "Pairs of Quantities" },
          { "chapterNumber": 14, "chapterName": "Ratios and Proportional Relationships" },
          { "chapterNumber": 15, "chapterName": "Percentage and Percent Change" },
          { "chapterNumber": 16, "chapterName": "Data Interpretation" },
          { "chapterNumber": 17, "chapterName": "Science Passage Analysis" },
          { "chapterNumber": 18, "chapterName": "Social Science Passage Analysis" },
          { "chapterNumber": 19, "chapterName": "Historical Passage Analysis" },
          { "chapterNumber": 20, "chapterName": "Literary Passage Analysis" },
          { "chapterNumber": 21, "chapterName": "Writing Revision" },
          { "chapterNumber": 22, "chapterName": "Idioms and Common Expressions" }
        ]
      },
      {
        "subject": "SAT",
        "grade": 12,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Numbers and Operations" },
          { "chapterNumber": 2, "chapterName": "Algebra and Functions" },
          { "chapterNumber": 3, "chapterName": "Geometry and Measurement" },
          { "chapterNumber": 4, "chapterName": "Data Analysis and Probability" },
          { "chapterNumber": 5, "chapterName": "Advanced Mathematics" },
          { "chapterNumber": 6, "chapterName": "Problem Solving Strategies" },
          { "chapterNumber": 7, "chapterName": "Critical Reading" },
          { "chapterNumber": 8, "chapterName": "Writing and Language" },
          { "chapterNumber": 9, "chapterName": "Essay Writing" },
          { "chapterNumber": 10, "chapterName": "Vocabulary in Context" },
          { "chapterNumber": 11, "chapterName": "Informational Graphics" },
          { "chapterNumber": 12, "chapterName": "Evidence-Based Reasoning" },
          { "chapterNumber": 13, "chapterName": "Pairs of Quantities" },
          { "chapterNumber": 14, "chapterName": "Ratios and Proportional Relationships" },
          { "chapterNumber": 15, "chapterName": "Percentage and Percent Change" },
          { "chapterNumber": 16, "chapterName": "Data Interpretation" },
          { "chapterNumber": 17, "chapterName": "Science Passage Analysis" },
          { "chapterNumber": 18, "chapterName": "Social Science Passage Analysis" },
          { "chapterNumber": 19, "chapterName": "Historical Passage Analysis" },
          { "chapterNumber": 20, "chapterName": "Literary Passage Analysis" },
          { "chapterNumber": 21, "chapterName": "Writing Revision" },
          { "chapterNumber": 22, "chapterName": "Idioms and Common Expressions" }
        ]
      },
      {
        "subject": "Maths",
        "grade": 9,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Further on Sets" },
          { "chapterNumber": 2, "chapterName": "The Number System" },
          { "chapterNumber": 3, "chapterName": "Solving Equations" },
          { "chapterNumber": 4, "chapterName": "Solving Inequalities" },
          { "chapterNumber": 5, "chapterName": "Introduction to Trigonometry" },
          { "chapterNumber": 6, "chapterName": "Regular Polygons" },
          { "chapterNumber": 7, "chapterName": "Congruency and Similarity" },
          { "chapterNumber": 8, "chapterName": "Vectors in Two Dimensions" },
          { "chapterNumber": 9, "chapterName": "Statistics and Probability" }
        ]
      },
      {
        "subject": "Maths",
        "grade": 10,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Relations and Functions" },
          { "chapterNumber": 2, "chapterName": "Polynomial Functions" },
          { "chapterNumber": 3, "chapterName": "Exponential and Logarithmic Functions" },
          { "chapterNumber": 4, "chapterName": "Trigonometric Functions" },
          { "chapterNumber": 5, "chapterName": "Circles" },
          { "chapterNumber": 6, "chapterName": "Solid Figures" },
          { "chapterNumber": 7, "chapterName": "Coordinate Geometry" }
        ]
      },
      {
        "subject": "Maths",
        "grade": 11,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Relations and Functions" },
          { "chapterNumber": 2, "chapterName": "Rational Expressions and Rational Functions" },
          { "chapterNumber": 3, "chapterName": "Matrices" },
          { "chapterNumber": 4, "chapterName": "Determinants and Their Properties" },
          { "chapterNumber": 5, "chapterName": "Vectors" },
          { "chapterNumber": 6, "chapterName": "Transformation of a Plane" },
          { "chapterNumber": 7, "chapterName": "Statistics" },
          { "chapterNumber": 8, "chapterName": "Probability" }
        ]
      },
      {
        "subject": "Maths",
        "grade": 12,
        "chapters": [
          { "chapterNumber": 1, "chapterName": "Sequence and Series" },
          { "chapterNumber": 2, "chapterName": "Introduction to Calculus" },
          { "chapterNumber": 3, "chapterName": "Statistics" },
          { "chapterNumber": 4, "chapterName": "Introduction to Linear Programming" },
          { "chapterNumber": 5, "chapterName": "Mathematical Application in Business" }
        ]
      }
    ]
  }
];
