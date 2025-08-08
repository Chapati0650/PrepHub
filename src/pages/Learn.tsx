import React from 'react';
import { BookOpen, Calculator, TrendingUp, Target, Clock, Award, Play, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';

const Learn = () => {
  const strategies = [
    {
      title: 'Time Management',
      description: 'Learn to allocate time effectively across different question types',
      tips: [
        'Spend no more than 1.5 minutes on easy questions',
        'Allow 2-3 minutes for medium difficulty questions',
        'Reserve 3-4 minutes for challenging problems',
        'Skip and return to difficult questions if needed'
      ]
    },
    {
      title: 'Problem-Solving Approach',
      description: 'Develop a systematic approach to tackle any math problem',
      tips: [
        'Read the question carefully and identify what\'s being asked',
        'Determine what information is given',
        'Choose the most efficient solution method',
        'Check your answer for reasonableness'
      ]
    },
    {
      title: 'Calculator Usage',
      description: 'Maximize efficiency with strategic calculator use',
      tips: [
        'Use calculator for complex arithmetic only',
        'Rely on mental math for simple calculations',
        'Double-check calculator entries for accuracy',
        'Practice both calculator and no-calculator sections'
      ]
    }
  ];

  const videos = [
    {
      title: 'Solving the HARDEST SAT Math Questions ONLY using Desmos',
      url: 'https://www.youtube.com/watch?v=SAIZErXDrK0&t=3s',
      embedId: 'SAIZErXDrK0',
      description: 'Learn advanced calculator strategies for the most challenging SAT Math problems',
      duration: '15:30',
      category: 'Calculator Strategies'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-primary text-white text-sm font-medium mb-6">
            <BookOpen className="h-4 w-4 mr-2" />
            Learn & Master
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            SAT Math
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Concepts & Strategies
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Master essential concepts and proven strategies to excel on the SAT Math section
          </p>
        </div>

        {/* Video Tutorials Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Video Tutorials</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {videos.map((video, index) => (
              <div 
                key={video.embedId}
                className="bg-white border border-gray-200 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 card-hover animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Video Thumbnail/Embed */}
                <div className="relative aspect-video bg-gray-100">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.embedId}?start=3`}
                    title={video.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                
                {/* Video Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {video.category}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {video.duration}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight">
                    {video.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4">
                    {video.description}
                  </p>
                  
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Watch on YouTube
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategies Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Test-Taking Strategies</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {strategies.map((strategy, index) => (
              <div 
                key={strategy.title}
                className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 card-hover animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">{strategy.title}</h3>
                <p className="text-gray-600 mb-6">{strategy.description}</p>
                <ul className="space-y-3">
                  {strategy.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start text-sm text-gray-700">
                      <div className="w-2 h-2 bg-gradient-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-primary rounded-3xl p-8 md:p-12 text-center animate-scale-in">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Put Your Knowledge to the Test?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Apply what you've learned from the videos and concepts with our adaptive practice sessions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/practice"
              className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              <Clock className="h-6 w-6 mr-3" />
              Start Practice Session
            </a>
            <a
              href="/dashboard"
              className="glass text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
            >
              <TrendingUp className="h-6 w-6 mr-3" />
              View Progress
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learn;