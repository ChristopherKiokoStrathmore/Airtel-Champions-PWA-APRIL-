import { useState } from 'react';
import { BookOpen, Brain, TrendingUp, Code, FileText, CheckCircle, Award, Users, Lightbulb, ChevronDown, ChevronRight, Download, Plus, Edit2, Trash2 } from 'lucide-react';

interface ScholarProfile {
  id: string;
  name: string;
  expertise: string[];
  affiliation: string;
  hIndex: number;
  role: string;
  avatar: string;
}

interface ResearchNote {
  id: string;
  section: string;
  content: string;
  references: string[];
  timestamp: string;
}

interface MLModel {
  id: string;
  name: string;
  purpose: string;
  applicability: string;
  references: string[];
}

export function ResearchPaperPlanner() {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // World-class scholar board for TAI research
  const scholarBoard: ScholarProfile[] = [
    {
      id: 'ml-1',
      name: 'Dr. Andrew Ng',
      expertise: ['Deep Learning', 'Reinforcement Learning', 'ML Deployment'],
      affiliation: 'Stanford University / DeepLearning.AI',
      hIndex: 189,
      role: 'ML Architecture Advisor',
      avatar: '🧠'
    },
    {
      id: 'ml-2',
      name: 'Dr. Yoshua Bengio',
      expertise: ['Neural Networks', 'Representation Learning', 'AI Ethics'],
      affiliation: 'Université de Montréal / Mila',
      hIndex: 245,
      role: 'Deep Learning Consultant',
      avatar: '🎓'
    },
    {
      id: 'sales-1',
      name: 'Prof. Philip Kotler',
      expertise: ['Marketing Analytics', 'Sales Strategy', 'Consumer Behavior'],
      affiliation: 'Northwestern University - Kellogg',
      hIndex: 156,
      role: 'Sales Intelligence Expert',
      avatar: '📊'
    },
    {
      id: 'sales-2',
      name: 'Dr. Thomas Steenburgh',
      expertise: ['Sales Force Management', 'Gamification', 'Field Sales'],
      affiliation: 'University of Virginia - Darden',
      hIndex: 34,
      role: 'Field Sales Specialist',
      avatar: '🎯'
    },
    {
      id: 'app-1',
      name: 'Dr. Martin Fowler',
      expertise: ['Software Architecture', 'Mobile Development', 'Microservices'],
      affiliation: 'ThoughtWorks',
      hIndex: 89,
      role: 'App Architecture Advisor',
      avatar: '💻'
    },
    {
      id: 'app-2',
      name: 'Dr. Jez Humble',
      expertise: ['DevOps', 'Continuous Delivery', 'Mobile Deployment'],
      affiliation: 'Google Cloud',
      hIndex: 67,
      role: 'Deployment & CI/CD Expert',
      avatar: '🚀'
    },
    {
      id: 'data-1',
      name: 'Dr. DJ Patil',
      expertise: ['Data Science', 'AI Strategy', 'Product Analytics'],
      affiliation: 'Former US Chief Data Scientist',
      hIndex: 52,
      role: 'Data Strategy Consultant',
      avatar: '📈'
    },
    {
      id: 'telecom-1',
      name: 'Prof. Mischa Dohler',
      expertise: ['5G/6G Networks', 'IoT', 'Telecom Analytics'],
      affiliation: 'King\'s College London',
      hIndex: 78,
      role: 'Telecom Domain Expert',
      avatar: '📡'
    }
  ];

  // Proposed ML models for TAI app
  const mlModels: MLModel[] = [
    {
      id: 'model-1',
      name: 'Predictive Sales Forecasting (LSTM)',
      purpose: 'Forecast individual SE performance based on historical activity patterns',
      applicability: 'Time-series analysis of sales data, program submissions, and field intelligence',
      references: [
        'Hochreiter & Schmidhuber (1997) - Long Short-Term Memory',
        'Gers et al. (2000) - Learning to Forget: Continual Prediction with LSTM',
        'Zhang et al. (2020) - Sales Forecasting with Deep Learning'
      ]
    },
    {
      id: 'model-2',
      name: 'Intelligence Quality Scoring (NLP + Ensemble)',
      purpose: 'Automatically score post quality using NLP sentiment, entity extraction, and engagement metrics',
      applicability: 'Explore feed posts, competitor intelligence submissions',
      references: [
        'Devlin et al. (2019) - BERT: Pre-training of Deep Bidirectional Transformers',
        'Liu et al. (2019) - RoBERTa: A Robustly Optimized BERT Pretraining Approach',
        'Vaswani et al. (2017) - Attention Is All You Need'
      ]
    },
    {
      id: 'model-3',
      name: 'Churn Prediction & Engagement Modeling',
      purpose: 'Identify SEs at risk of disengagement before they drop off',
      applicability: 'App usage analytics, login frequency, submission patterns',
      references: [
        'Chen & Guestrin (2016) - XGBoost: A Scalable Tree Boosting System',
        'Ke et al. (2017) - LightGBM: A Highly Efficient Gradient Boosting Decision Tree',
        'Ahmad et al. (2019) - Customer Churn Prediction in Telecom using ML'
      ]
    },
    {
      id: 'model-4',
      name: 'Recommendation Engine (Collaborative Filtering)',
      purpose: 'Recommend relevant intelligence posts and programs to each SE based on zone, role, and interests',
      applicability: 'Explore feed personalization, program suggestions',
      references: [
        'Koren et al. (2009) - Matrix Factorization Techniques for Recommender Systems',
        'He et al. (2017) - Neural Collaborative Filtering',
        'Rendle (2010) - Factorization Machines'
      ]
    },
    {
      id: 'model-5',
      name: 'Anomaly Detection (Isolation Forest / Autoencoder)',
      purpose: 'Detect unusual activity patterns, potential fraud, or exceptional performance',
      applicability: 'Fraud detection, outlier SE identification for coaching',
      references: [
        'Liu et al. (2008) - Isolation Forest for Anomaly Detection',
        'Chandola et al. (2009) - Anomaly Detection: A Survey',
        'Malhotra et al. (2016) - LSTM-based Encoder-Decoder for Anomaly Detection'
      ]
    },
    {
      id: 'model-6',
      name: 'Computer Vision for Receipt/Photo Verification',
      purpose: 'Automatically verify and extract data from submitted photos (receipts, signage, competitor materials)',
      applicability: 'Program submissions with photo evidence',
      references: [
        'He et al. (2016) - Deep Residual Learning (ResNet)',
        'Redmon et al. (2016) - YOLO: Real-Time Object Detection',
        'Ren et al. (2015) - Faster R-CNN for Object Detection'
      ]
    },
    {
      id: 'model-7',
      name: 'Geospatial Clustering (DBSCAN / K-Means)',
      purpose: 'Identify sales hotspots, competitor activity zones, and optimal territory allocation',
      applicability: 'Location-based intelligence, zone performance analysis',
      references: [
        'Ester et al. (1996) - DBSCAN: A Density-Based Algorithm',
        'Arthur & Vassilvitskii (2007) - K-means++',
        'Schubert et al. (2017) - DBSCAN Revisited'
      ]
    },
    {
      id: 'model-8',
      name: 'Reinforcement Learning for Dynamic Incentives',
      purpose: 'Optimize gamification point allocation and program rewards to maximize engagement',
      applicability: 'Points system, program design, leaderboard optimization',
      references: [
        'Sutton & Barto (2018) - Reinforcement Learning: An Introduction',
        'Mnih et al. (2015) - Human-level Control through Deep RL (DQN)',
        'Silver et al. (2017) - Mastering Chess and Shogi by Self-Play with a General RL Algorithm'
      ]
    }
  ];

  const paperStructure = [
    {
      id: 'abstract',
      title: 'Abstract',
      score: 5,
      pages: 0.25,
      cat: 'CAT 1',
      deadline: 'Dec 10, 2025',
      description: 'Concise summary of the entire research (150-250 words)',
      keyPoints: [
        'Problem statement: Lack of real-time intelligence in field sales',
        'Solution: TAI app with gamification and ML-driven insights',
        'Methodology: CRISP-DM with 8 ML models',
        'Key results: X% engagement increase, Y% accuracy in predictions',
        'Contribution: Novel integration of sales intelligence + gamification + ML'
      ],
      scholarAdvice: 'Dr. Ng: "Focus on the business impact first, then technical novelty"'
    },
    {
      id: 'introduction',
      title: 'Introduction',
      score: 10,
      pages: 2,
      cat: 'CAT 1',
      deadline: 'Dec 10, 2025',
      description: 'Set the stage: Why this research matters',
      keyPoints: [
        'Background: Airtel Kenya\'s 662 Sales Executives, field sales challenges',
        'Problem: Manual intelligence gathering, delayed insights, low engagement',
        'Research gap: Limited ML applications in telecom field sales',
        'Objectives: Build offline-first app, integrate 8 ML models, measure impact',
        'Significance: Scalable to other telecom markets, contributions to sales AI'
      ],
      scholarAdvice: 'Prof. Kotler: "Quantify the business problem - lost revenue, delayed decisions"'
    },
    {
      id: 'literature',
      title: 'Literature Review',
      score: 25,
      pages: 1,
      cat: 'CAT 1 (20%)',
      deadline: 'Dec 10, 2025',
      description: 'Summary of at least 15 recent scientific articles',
      keyPoints: [
        'Theme 1: Gamification in enterprise apps (5 papers)',
        'Theme 2: ML in sales forecasting and CRM (5 papers)',
        'Theme 3: Mobile-first architecture for emerging markets (3 papers)',
        'Theme 4: NLP for business intelligence (2 papers)',
        'Research gap: No existing work on ML-gamified sales intelligence in African telecom'
      ],
      scholarAdvice: 'Dr. Bengio: "Focus on transformer-based NLP for intelligence scoring"',
      suggestedPapers: [
        'Liu et al. (2017) - Gamification and User Engagement in Mobile Apps',
        'Deterding et al. (2011) - From Game Design Elements to Gamefulness',
        'Hamari et al. (2014) - Does Gamification Work? A Literature Review',
        'Zhang et al. (2020) - Deep Learning for Sales Forecasting',
        'Singh et al. (2019) - AI-Driven CRM Systems',
        'Chen & Guestrin (2016) - XGBoost for Prediction Tasks',
        'Devlin et al. (2019) - BERT for Text Classification',
        'Rendle (2010) - Factorization Machines for Recommendations',
        'He et al. (2017) - Neural Collaborative Filtering',
        'Liu et al. (2008) - Isolation Forest for Anomaly Detection',
        'Ester et al. (1996) - DBSCAN for Spatial Clustering',
        'Mnih et al. (2015) - Deep Q-Networks for RL',
        'Sutton & Barto (2018) - Reinforcement Learning',
        'Redmon et al. (2016) - YOLO for Image Recognition',
        'Humble & Farley (2010) - Continuous Delivery'
      ]
    },
    {
      id: 'methodology',
      title: 'Methodology (CRISP-DM)',
      score: 25,
      pages: 3,
      cat: 'CAT 1 (20%) + EXAM (60%)',
      deadline: 'Dec 10, 2025',
      description: 'Follow CRISP-DM framework for ML implementation',
      subsections: [
        {
          title: 'Data Understanding (0.5 pages)',
          content: [
            'Data sources: User activity logs, post submissions, location data, program forms',
            'Dataset size: 662 users × 6 months × avg 50 actions/user/month = ~200K records',
            'Features: User demographics, engagement metrics, temporal patterns, geospatial data',
            'Data quality assessment: Missing values, outliers, data imbalance'
          ]
        },
        {
          title: 'Data Preparation (0.5 pages)',
          content: [
            'Data cleaning: Handle missing values, remove duplicates',
            'Feature engineering: Create engagement scores, time-based features, text embeddings',
            'Data transformation: Normalization, encoding categorical variables',
            'Train/validation/test split: 70/15/15'
          ]
        },
        {
          title: 'Exploratory Data Analysis (0.5 pages)',
          content: [
            'User engagement distribution across zones and roles',
            'Correlation analysis: Posts vs points vs performance',
            'Temporal patterns: Peak usage times, weekly/monthly trends',
            'Visualization: Heatmaps, scatter plots, time series'
          ]
        },
        {
          title: 'Machine Learning Modeling (0.5 pages)',
          content: [
            'Model selection rationale for each of 8 models',
            'Hyperparameter tuning strategy (Grid Search / Random Search / Bayesian)',
            'Cross-validation approach (k-fold, time-series split)',
            'Baseline models for comparison'
          ]
        },
        {
          title: 'Optimization (0.5 pages)',
          content: [
            'Model optimization techniques (pruning, quantization for mobile)',
            'Inference latency requirements (<100ms for real-time features)',
            'Model compression for offline-first deployment',
            'A/B testing framework design'
          ]
        },
        {
          title: 'Deployment (0.5 pages)',
          content: [
            'Architecture: Flutter app + Supabase + Edge Functions + ML microservices',
            'CI/CD pipeline: GitHub Actions → Docker → Supabase',
            'Monitoring: Model drift detection, performance tracking',
            'Offline-first ML: TensorFlow Lite models embedded in Flutter app'
          ]
        }
      ],
      scholarAdvice: 'Dr. Patil: "Show the full ML lifecycle, not just model training"'
    },
    {
      id: 'results',
      title: 'Results',
      score: 10,
      pages: 3,
      cat: 'CAT 2 (20%) + EXAM (60%)',
      deadline: 'Jan 21, 2026',
      description: 'Present findings with tables, charts, and statistical analysis',
      keyPoints: [
        'Model performance metrics (accuracy, precision, recall, F1, RMSE, MAE)',
        'Comparative analysis: 8 models vs baselines',
        'Business impact: User engagement ↑X%, intelligence quality ↑Y%',
        'A/B test results: ML-powered features vs control group',
        'Computational efficiency: Inference time, model size, resource usage'
      ],
      visualizations: [
        'Table 1: Model Performance Comparison',
        'Figure 1: Sales Forecasting Accuracy (LSTM vs Baseline)',
        'Figure 2: Intelligence Quality Score Distribution',
        'Figure 3: User Engagement Before/After ML Integration',
        'Figure 4: ROC Curves for Churn Prediction',
        'Figure 5: Recommendation Engine Hit Rate@K',
        'Figure 6: Anomaly Detection Precision-Recall Curve',
        'Figure 7: Geospatial Clustering Visualization'
      ],
      scholarAdvice: 'Dr. Steenburgh: "Show ROI - tie ML metrics to revenue impact"'
    },
    {
      id: 'discussion',
      title: 'Discussion',
      score: 10,
      pages: 2,
      cat: 'CAT 2 (20%) + EXAM (60%)',
      deadline: 'Jan 21, 2026',
      description: 'Interpret results, compare with literature, discuss limitations',
      keyPoints: [
        'Interpretation: Why did LSTM outperform ARIMA? What drove engagement?',
        'Comparison with literature: How do results align with previous studies?',
        'Practical implications: Deployment recommendations for other telecom operators',
        'Limitations: Data quality issues, model biases, generalizability',
        'Ethical considerations: Privacy, fairness in gamification, AI transparency'
      ],
      scholarAdvice: 'Dr. Bengio: "Address potential biases in recommendation and scoring models"'
    },
    {
      id: 'conclusion',
      title: 'Conclusion',
      score: 5,
      pages: 0.5,
      cat: 'Final Submission',
      deadline: 'Jan 21, 2026',
      description: 'Summarize findings and future work',
      keyPoints: [
        'Key contributions: First ML-gamified sales intelligence system in African telecom',
        'Main findings: 8 models achieved X% improvement over baselines',
        'Business impact: Y% increase in field intelligence quality',
        'Future work: Federated learning for privacy, multi-language NLP, real-time RL'
      ],
      scholarAdvice: 'Dr. Humble: "Emphasize the deployment success - that\'s where most ML projects fail"'
    },
    {
      id: 'references',
      title: 'References',
      score: 5,
      pages: 1,
      cat: 'CAT 1 & 2',
      deadline: 'All submissions',
      description: 'APA/IEEE format, minimum 15 recent papers (2019-2025)',
      scholarAdvice: 'Use Zotero or Mendeley for reference management'
    },
    {
      id: 'notebook',
      title: 'Jupyter Notebook',
      score: 5,
      pages: 'N/A',
      cat: 'CAT 1 & 2',
      deadline: 'All submissions',
      description: 'Reproducible code with documentation',
      keyPoints: [
        'Data loading and exploration',
        'EDA with visualizations',
        'Model training for all 8 models',
        'Evaluation and comparison',
        'Well-documented with markdown cells'
      ],
      scholarAdvice: 'Dr. Fowler: "Make it reproducible - include requirements.txt, data sources, clear instructions"'
    }
  ];

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const addNote = () => {
    if (!newNoteContent.trim()) return;

    const note: ResearchNote = {
      id: `note-${Date.now()}`,
      section: selectedSection,
      content: newNoteContent,
      references: [],
      timestamp: new Date().toISOString()
    };

    setNotes([...notes, note]);
    setNewNoteContent('');
    setShowAddNote(false);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8" />
            <h1 className="text-3xl font-bold">TAI Research Paper Planner</h1>
          </div>
          <p className="text-blue-100 text-sm">
            Machine Learning Integration in Sales Intelligence Network • CRISP-DM Methodology
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: '📋' },
              { id: 'scholars', label: 'Scholar Board', icon: '👥' },
              { id: 'ml-models', label: 'ML Models', icon: '🤖' },
              { id: 'structure', label: 'Paper Structure', icon: '📝' },
              { id: 'notes', label: 'My Notes', icon: '💡' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeSection === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">🎯 Research Title</h2>
              <p className="text-xl mb-6 leading-relaxed">
                "Machine Learning-Driven Sales Intelligence Network: A Gamified Approach to Real-Time Field Intelligence in Emerging Telecom Markets"
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="text-3xl mb-2">🧠</div>
                  <div className="text-sm font-semibold">8 ML Models</div>
                  <div className="text-xs opacity-90">LSTM, BERT, XGBoost, RL</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="text-3xl mb-2">👥</div>
                  <div className="text-sm font-semibold">662 Users</div>
                  <div className="text-xs opacity-90">Airtel Kenya SEs</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="text-3xl mb-2">📱</div>
                  <div className="text-sm font-semibold">Offline-First</div>
                  <div className="text-xs opacity-90">Flutter + Supabase</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📅</span> Submission Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                  <div className="text-2xl">📚</div>
                  <div className="flex-1">
                    <div className="font-semibold">CAT 1 (20%)</div>
                    <div className="text-sm text-gray-600">Abstract + Intro + Literature + Methodology</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-yellow-700">Dec 10, 2025</div>
                    <div className="text-xs text-gray-500">Exam Day</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <div className="text-2xl">📊</div>
                  <div className="flex-1">
                    <div className="font-semibold">CAT 2 (20%) + EXAM (60%)</div>
                    <div className="text-sm text-gray-600">Results + Discussion + Conclusion</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-700">Jan 21, 2026</div>
                    <div className="text-xs text-gray-500">Final Submission</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Research Contribution */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-500" />
                Novel Contributions
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="font-semibold text-green-700 mb-1">1. Theoretical</div>
                  <p className="text-sm text-gray-700">First comprehensive framework combining gamification, ML, and sales intelligence in African telecom context</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="font-semibold text-blue-700 mb-1">2. Methodological</div>
                  <p className="text-sm text-gray-700">Novel ensemble of 8 ML models for multi-faceted sales intelligence analysis</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <div className="font-semibold text-purple-700 mb-1">3. Practical</div>
                  <p className="text-sm text-gray-700">Offline-first architecture enabling ML deployment in low-connectivity environments (2G/3G)</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <div className="font-semibold text-orange-700 mb-1">4. Social Impact</div>
                  <p className="text-sm text-gray-700">Scalable solution for empowering field sales teams across emerging markets</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scholar Board Section */}
        {activeSection === 'scholars' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-7 h-7 text-purple-600" />
                World-Class Advisory Board
              </h2>
              <p className="text-gray-600 mb-6">
                Leading experts in Machine Learning, Sales Intelligence, and App Deployment collaborating to guide your research.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {scholarBoard.map(scholar => (
                <div key={scholar.id} className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">{scholar.avatar}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{scholar.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{scholar.affiliation}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                          h-index: {scholar.hIndex}
                        </span>
                      </div>
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-gray-500 mb-1">EXPERTISE:</div>
                        <div className="flex flex-wrap gap-1">
                          {scholar.expertise.map((exp, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                              {exp}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-2 rounded">
                        {scholar.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ML Models Section */}
        {activeSection === 'ml-models' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Brain className="w-7 h-7 text-blue-600" />
                8 Machine Learning Models for TAI
              </h2>
              <p className="text-gray-600">
                Comprehensive ML pipeline addressing sales forecasting, intelligence quality, engagement, recommendations, and more.
              </p>
            </div>

            <div className="grid gap-6">
              {mlModels.map((model, idx) => (
                <div key={model.id} className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                        {idx + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{model.name}</h3>
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-gray-500 mb-1">PURPOSE:</div>
                        <p className="text-sm text-gray-700">{model.purpose}</p>
                      </div>
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-gray-500 mb-1">TAI APPLICABILITY:</div>
                        <p className="text-sm text-gray-700">{model.applicability}</p>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-2">KEY REFERENCES:</div>
                        <ul className="space-y-1">
                          {model.references.map((ref, refIdx) => (
                            <li key={refIdx} className="text-xs text-gray-600 pl-4 border-l-2 border-gray-300">
                              📄 {ref}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paper Structure Section */}
        {activeSection === 'structure' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-7 h-7 text-green-600" />
                Research Paper Structure (CRISP-DM)
              </h2>
              <p className="text-gray-600 mb-4">
                Following your evaluation rubric with detailed guidance for each section.
              </p>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                  <span>CAT 1 (20%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded"></div>
                  <span>CAT 2 (20%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded"></div>
                  <span>EXAM (60%)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {paperStructure.map(section => (
                <div key={section.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                        section.cat.includes('CAT 1') ? 'bg-yellow-500' :
                        section.cat.includes('CAT 2') ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}>
                        {section.score}%
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
                        <p className="text-sm text-gray-600">{section.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-gray-500">{section.cat}</div>
                        <div className="text-xs text-gray-500">{typeof section.pages === 'number' ? `${section.pages} pages` : section.pages}</div>
                      </div>
                    </div>
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedSections.has(section.id) && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      {section.keyPoints && (
                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-gray-700 mb-2">🎯 Key Points:</h4>
                          <ul className="space-y-2">
                            {section.keyPoints.map((point, idx) => (
                              <li key={idx} className="text-sm text-gray-700 pl-4 border-l-2 border-blue-400">
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {section.subsections && (
                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-gray-700 mb-3">📋 CRISP-DM Subsections:</h4>
                          <div className="space-y-3">
                            {section.subsections.map((sub, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                                <h5 className="text-sm font-semibold text-gray-900 mb-2">{sub.title}</h5>
                                <ul className="space-y-1">
                                  {sub.content.map((item, itemIdx) => (
                                    <li key={itemIdx} className="text-xs text-gray-600 pl-3">
                                      • {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.suggestedPapers && (
                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-gray-700 mb-2">📚 Suggested Papers (15+):</h4>
                          <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-64 overflow-y-auto">
                            <ul className="space-y-1.5">
                              {section.suggestedPapers.map((paper, idx) => (
                                <li key={idx} className="text-xs text-gray-700 pl-3 hover:bg-gray-50 p-1 rounded">
                                  {idx + 1}. {paper}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {section.visualizations && (
                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-gray-700 mb-2">📊 Visualizations:</h4>
                          <ul className="grid md:grid-cols-2 gap-2">
                            {section.visualizations.map((viz, idx) => (
                              <li key={idx} className="text-xs text-gray-700 bg-white rounded p-2 border border-gray-200">
                                {viz}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {section.scholarAdvice && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="text-xs font-semibold text-purple-700 mb-1">💡 Expert Advice:</div>
                          <p className="text-xs text-purple-900 italic">{section.scholarAdvice}</p>
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedSection(section.id);
                            setShowAddNote(true);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Note
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes Section */}
        {activeSection === 'notes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Lightbulb className="w-7 h-7 text-yellow-500" />
                  My Research Notes
                </h2>
                <button
                  onClick={() => setShowAddNote(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Note
                </button>
              </div>
              <p className="text-gray-600">
                Organize your ideas, key findings, and references for each section.
              </p>
            </div>

            {notes.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-md border border-gray-200">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-600 mb-4">No notes yet. Start capturing your research insights!</p>
                <button
                  onClick={() => setShowAddNote(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create First Note
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {notes.map(note => (
                  <div key={note.id} className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          {paperStructure.find(s => s.id === note.section)?.title || 'General'}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{note.content}</p>
                    <div className="text-xs text-gray-500">
                      {new Date(note.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Add Research Note</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select section...</option>
                  {paperStructure.map(section => (
                    <option key={section.id} value={section.id}>{section.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Note Content</label>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Write your research notes, key findings, or ideas..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                  rows={8}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddNote(false);
                  setNewNoteContent('');
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addNote}
                disabled={!selectedSection || !newNoteContent.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
