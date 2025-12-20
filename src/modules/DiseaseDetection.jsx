import { useState, useEffect } from 'react';
import diseaseDetector from '../lib/diseaseDetection';
import { DataLayer } from '../lib/dataLayer';

export default function DiseaseDetection() {
  const [animals, setAnimals] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [species, setSpecies] = useState('cattle');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [results, setResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saveMode, setSaveMode] = useState(false);
  const [diagnosisNotes, setDiagnosisNotes] = useState('');

  const allSymptoms = diseaseDetector.getAllSymptoms();

  // Group symptoms by category for better UX
  const symptomCategories = {
    'General': ['fever', 'weight_loss', 'reduced_appetite', 'depression', 'dehydration'],
    'Respiratory': ['coughing', 'nasal_discharge', 'respiratory_distress', 'rapid_breathing', 'eye_discharge'],
    'Digestive': ['diarrhea', 'bloody_diarrhea', 'greenish_diarrhea', 'bloat', 'excessive_salivation'],
    'Skin/Coat': ['poor_coat', 'ruffled_feathers', 'skin_lesions', 'blisters_mouth', 'blisters_feet'],
    'Udder/Milk': ['swollen_udder', 'hot_udder', 'hard_udder', 'reduced_milk', 'abnormal_milk', 'clots_in_milk', 'blood_in_milk'],
    'Movement': ['lameness', 'difficulty_breathing', 'paralysis', 'twisted_neck', 'kicking_at_belly'],
    'Other': ['anemia', 'bottle_jaw', 'pot_belly', 'restlessness', 'collapse', 'sudden_death']
  };

  useEffect(() => {
    loadAnimals();
  }, []);

  const loadAnimals = async () => {
    const data = await DataLayer.animals.getAll();
    setAnimals(data);
  };

  const toggleSymptom = (symptomValue) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptomValue)
        ? prev.filter(s => s !== symptomValue)
        : [...prev, symptomValue]
    );
  };

  const analyzeSymptoms = () => {
    if (selectedSymptoms.length === 0) {
      alert('Please select at least one symptom');
      return;
    }

    setAnalyzing(true);
    
    // Simulate small delay for better UX
    setTimeout(() => {
      const analysis = diseaseDetector.analyzeSymptoms(selectedSymptoms, species);
      setResults(analysis);
      setAnalyzing(false);
    }, 500);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!imageFile) {
      alert('Please upload an image first');
      return;
    }

    setAnalyzing(true);

    try {
      const img = new Image();
      img.src = imagePreview;
      await new Promise(resolve => img.onload = resolve);

      const result = await diseaseDetector.analyzeAnimalImage(img);
      
      if (result.useSymptomChecker) {
        alert('AI model not loaded. Please use the symptom checker below.');
      } else {
        setResults(result);
      }
    } catch (error) {
      console.error('Image analysis failed:', error);
      alert('Image analysis failed. Please try the symptom checker instead.');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveDiagnosis = async () => {
    if (!selectedAnimal || !results?.success || results.matches.length === 0) {
      alert('Please select an animal and complete analysis first');
      return;
    }

    const topDiagnosis = results.matches[0];

    const diagnosisRecord = {
      id: Date.now().toString(),
      animalId: selectedAnimal,
      date: new Date().toISOString().split('T')[0],
      disease: topDiagnosis.name,
      confidence: (topDiagnosis.confidence * 100).toFixed(0) + '%',
      severity: topDiagnosis.severity,
      symptoms: selectedSymptoms,
      notes: diagnosisNotes,
      treatment: topDiagnosis.treatment,
      timestamp: Date.now()
    };

    try {
      // Save to treatments/health records
      await DataLayer.treatments?.create?.(diagnosisRecord) || 
            localStorage.setItem(`diagnosis_${diagnosisRecord.id}`, JSON.stringify(diagnosisRecord));
      
      alert('✅ Diagnosis saved successfully!');
      resetForm();
    } catch (error) {
      console.error('Failed to save diagnosis:', error);
      alert('❌ Failed to save diagnosis');
    }
  };

  const resetForm = () => {
    setSelectedAnimal(null);
    setSelectedSymptoms([]);
    setResults(null);
    setImageFile(null);
    setImagePreview(null);
    setSaveMode(false);
    setDiagnosisNotes('');
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔬 AI Disease Detection</h1>
        <p className="text-gray-600">
          Analyze symptoms to identify potential diseases and get treatment recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Input */}
        <div>
          {/* Animal Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Select Animal (Optional)</h2>
            <select
              id="disease-animal"
              name="selectedAnimal"
              value={selectedAnimal || ''}
              onChange={(e) => {
                setSelectedAnimal(e.target.value);
                const animal = animals.find(a => a.id === e.target.value);
                if (animal) setSpecies(animal.species?.toLowerCase() || 'cattle');
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an animal or check general symptoms</option>
              {animals.map(animal => (
                <option key={animal.id} value={animal.id}>
                  {animal.name} ({animal.species}) - {animal.tagId || animal.id}
                </option>
              ))}
            </select>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or select species:
              </label>
              <select
                id="disease-species"
                name="species"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cattle">Cattle</option>
                <option value="goat">Goat</option>
                <option value="sheep">Sheep</option>
                <option value="pig">Pig</option>
                <option value="poultry">Poultry</option>
              </select>
            </div>
          </div>

          {/* Image Upload (Optional) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. Upload Image (Optional)</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {imagePreview ? (
                <div>
                  <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg mb-4" />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div>
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <label className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Click to upload or drag and drop
                    </span>
                    <input
                      id="disease-image-upload"
                      name="imageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
            </div>
            {imageFile && (
              <button
                onClick={analyzeImage}
                disabled={analyzing}
                className="mt-4 w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
              >
                {analyzing ? '🔍 Analyzing Image...' : '🔍 Analyze Image with AI'}
              </button>
            )}
          </div>

          {/* Symptom Checker */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              3. Select Observed Symptoms ({selectedSymptoms.length} selected)
            </h2>

            {Object.entries(symptomCategories).map(([category, symptoms]) => (
              <div key={category} className="mb-6">
                <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">
                  {category}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {symptoms.map(symptomValue => {
                    const symptom = allSymptoms.find(s => s.value === symptomValue);
                    if (!symptom) return null;
                    
                    return (
                      <label
                        key={symptom.value}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedSymptoms.includes(symptom.value)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          id={`symptom-${symptom.value}`}
                          name={`symptom_${symptom.value}`}
                          type="checkbox"
                          checked={selectedSymptoms.includes(symptom.value)}
                          onChange={() => toggleSymptom(symptom.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {symptom.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex gap-3 mt-6">
              <button
                onClick={analyzeSymptoms}
                disabled={analyzing || selectedSymptoms.length === 0}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? '🔍 Analyzing...' : `🔍 Analyze ${selectedSymptoms.length} Symptoms`}
              </button>
              <button
                onClick={() => setSelectedSymptoms([])}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div>
          {results?.success && results.matches.length > 0 ? (
            <div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  🎯 Analysis Results ({results.matches.length} possible diseases)
                </h2>

                <div className="space-y-4">
                  {results.matches.map((match, idx) => (
                    <div
                      key={idx}
                      className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {idx + 1}. {match.name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${getSeverityColor(match.severity)}`}>
                              {match.severity?.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-600">
                              Confidence: <strong>{(match.confidence * 100).toFixed(0)}%</strong>
                            </span>
                            {match.contagious && (
                              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                                ⚠️ CONTAGIOUS
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Matched Symptoms */}
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Matched Symptoms ({match.matchedSymptoms.length}/{match.totalSymptoms}):
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {match.matchedSymptoms.map((symptom, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              ✓ {symptom.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Treatment */}
                      <div className="mb-4">
                        <div className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                          💊 Treatment Plan:
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {match.treatment.slice(0, 5).map((t, i) => (
                            <li key={i} className={t.includes('🚨') ? 'text-red-600 font-bold' : ''}>
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Prevention */}
                      <div>
                        <div className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                          🛡️ Prevention:
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {match.prevention.slice(0, 3).map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Diagnosis */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-green-900 mb-4">
                  💾 Save Diagnosis to Animal Record
                </h3>
                
                {!saveMode ? (
                  <button
                    onClick={() => setSaveMode(true)}
                    disabled={!selectedAnimal}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedAnimal ? '📝 Add Notes & Save' : '⚠️ Select an animal first'}
                  </button>
                ) : (
                  <div>
                    <textarea
                      id="diagnosis-notes"
                      name="diagnosisNotes"
                      value={diagnosisNotes}
                      onChange={(e) => setDiagnosisNotes(e.target.value)}
                      placeholder="Add additional notes about the diagnosis, treatment plan, or observations..."
                      className="w-full p-3 border border-gray-300 rounded-lg mb-3 h-32"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={saveDiagnosis}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        ✅ Save Diagnosis
                      </button>
                      <button
                        onClick={() => setSaveMode(false)}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : results?.success && results.matches.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-green-900 mb-2">No Diseases Detected</h3>
              <p className="text-green-700">
                The selected symptoms don't match any known disease patterns for {species}.
                This could indicate good health or symptoms that need veterinary attention.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">🔬</div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Ready to Analyze</h3>
              <p className="text-blue-700 mb-4">
                Select symptoms from the left panel and click "Analyze Symptoms" to detect potential diseases.
              </p>
              <ul className="text-left text-blue-800 text-sm space-y-2 max-w-md mx-auto">
                <li>✓ Select at least 3-5 symptoms for best results</li>
                <li>✓ Be specific about what you observe</li>
                <li>✓ Consider uploading an image if visible symptoms exist</li>
                <li>✓ Save diagnosis to track animal health history</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
