import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Target, TrendingUp, Users, Star, Zap, Award, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-gray-50/50 to-transparent rounded-full"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center animate-slide-up">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium mb-8 animate-pulse-glow border border-gray-200">
              <Star className="h-4 w-4 mr-2" />
              AI-Powered SAT Math Practice
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-primary bg-clip-text text-transparent">Master SAT Math with</span>
              <span className="block bg-gradient-warm bg-clip-text text-transparent animate-shimmer">
                Intelligent Practice
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Experience personalized learning with our advanced AI system. Get targeted practice, 
              instant feedback, and track your progress toward your dream score.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              {user ? (
                <Link
                  to="/practice"
                  className="group bg-gradient-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all duration-300 shadow-lg flex items-center"
                >
                  <Zap className="h-6 w-6 mr-3 group-hover:animate-bounce" />
                  Start Practicing
                  <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="group bg-gradient-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all duration-300 shadow-lg flex items-center"
                  >
                    <Zap className="h-6 w-6 mr-3 group-hover:animate-bounce" />
                    Get Started Free
                    <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/practice"
                    className="group bg-white text-gray-900 border-2 border-gray-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 flex items-center"
                  >
                    <BookOpen className="h-6 w-6 mr-3" />
                    Try Demo
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center animate-scale-in shadow-lg" style={{ animationDelay: '0.1s' }}>
                <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">300+</div>
                <div className="text-gray-600 text-sm">Practice Questions</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center animate-scale-in shadow-lg" style={{ animationDelay: '0.2s' }}>
                <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">98%</div>
                <div className="text-gray-600 text-sm">Success Rate</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center animate-scale-in shadow-lg" style={{ animationDelay: '0.3s' }}>
                <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">5M+</div>
                <div className="text-gray-600 text-sm">Questions Solved</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center animate-scale-in shadow-lg" style={{ animationDelay: '0.4s' }}>
                <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">24/7</div>
                <div className="text-gray-600 text-sm">AI Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose
              <span className="bg-gradient-primary bg-clip-text text-transparent"> PrepHub</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge AI with proven SAT strategies to deliver 
              personalized learning experiences that adapt to your unique needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 card-hover animate-scale-in">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Adaptive Learning</h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI analyzes your performance and adapts question difficulty in real-time, 
                ensuring optimal challenge levels for maximum learning efficiency.
              </p>
            </div>

            <div className="group bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 card-hover animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Progress Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Comprehensive analytics dashboard shows your strengths, weaknesses, and 
                improvement trends across all SAT Math topics.
              </p>
            </div>

            <div className="group bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 card-hover animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 bg-gradient-success rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Expert Content</h3>
              <p className="text-gray-600 leading-relaxed">
                Questions crafted by SAT experts and validated through machine learning 
                to mirror actual test patterns and difficulty levels.
              </p>
            </div>

            <div className="group bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 card-hover animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <div className="w-16 h-16 bg-gradient-warm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Flexible Timing</h3>
              <p className="text-gray-600 leading-relaxed">
                Practice with custom time limits or at your own pace. Build test-taking 
                stamina with realistic timing constraints.
              </p>
            </div>

            <div className="group bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 card-hover animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <div className="w-16 h-16 bg-gradient-cool rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Community Support</h3>
              <p className="text-gray-600 leading-relaxed">
                Join thousands of students on the same journey. Share strategies, 
                celebrate milestones, and learn from each other.
              </p>
            </div>

            <div className="group bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 card-hover animate-scale-in" style={{ animationDelay: '0.5s' }}>
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Proven Results</h3>
              <p className="text-gray-600 leading-relaxed">
                Students using PrepHub see an average score improvement of 150+ points 
                within 3 months of consistent practice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Boost Your
            <span className="bg-gradient-primary bg-clip-text text-transparent"> SAT Score</span>?
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Join thousands of students who have already improved their scores with our AI-powered platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {user ? (
              <Link
                to="/practice"
                className="group bg-gradient-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all duration-300 flex items-center"
              >
                <Zap className="h-6 w-6 mr-3 group-hover:animate-bounce" />
                Continue Practicing
                <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="group bg-gradient-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all duration-300 flex items-center"
                >
                  <Zap className="h-6 w-6 mr-3 group-hover:animate-bounce" />
                  Start Free Trial
                  <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/practice"
                  className="group bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 flex items-center"
                >
                  <BookOpen className="h-6 w-6 mr-3" />
                  Try Demo
                </Link>
              </>
            )}
          </div>

          <div className="mt-12 flex items-center justify-center space-x-8 text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm">No Credit Card Required</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm">Instant Access</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm">Cancel Anytime</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;