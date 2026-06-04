import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "أي من الشموع التالية تشير إلى انعكاس صعودي محتمل في نهاية اتجاه هبوطي؟",
    options: ["شمعة المطرقة (Hammer)", "شمعة الشهاب (Shooting Star)", "شمعة الدوجي (Doji)", "شمعة الماروبوزو (Marubozu) الهبوطية"],
    correctAnswer: 0
  },
  {
    id: 2,
    question: "عند تداول الذهب (XAU/USD)، ما هو العامل الاقتصادي الأكثر تأثيراً على ارتفاع سعره تاريخياً؟",
    options: ["ارتفاع أسعار الفائدة الأمريكية", "زيادة قوة الدولار الأمريكي", "ارتفاع معدلات التضخم والتوترات الجيوسياسية", "الاستقرار الاقتصادي العالمي"],
    correctAnswer: 2
  },
  {
    id: 3,
    question: "ما هو الهدف الرئيسي لاستخدام أمر (Stop Loss) في التداول؟",
    options: ["ضمان تحقيق أرباح سريعة", "إيقاف الخسارة عند مستوى محدد لحماية رأس المال", "مضاعفة حجم الصفقة تلقائياً", "تنفيذ الصفقة بأفضل سعر متاح في السوق"],
    correctAnswer: 1
  },
  {
    id: 4,
    question: "في تحليل تدفق الأوامر (Order Flow)، ماذا يعني وجود 'أوامر جليدية' (Iceberg Orders) ضخمة في جانب الشراء؟",
    options: ["رغبة مؤسسية خفية في الشراء دون رفع السعر فجأة", "انهيار وشيك في الأسعار", "عدم وجود سيولة كافية في السوق", "رغبة في بيع كميات كبيرة بسرعة"],
    correctAnswer: 0
  }
];

export default function CourseQuiz({ isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState(Array(QUIZ_QUESTIONS.length).fill(null));
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const totalQuestions = QUIZ_QUESTIONS.length;
  const currentQ = QUIZ_QUESTIONS[currentIndex];
  const progressPercent = ((currentIndex) / totalQuestions) * 100;
  
  // Calculate score when finished
  const score = userAnswers.reduce((acc, answer, index) => {
    return answer === QUIZ_QUESTIONS[index].correctAnswer ? acc + 1 : acc;
  }, 0);
  
  const percentageScore = (score / totalQuestions) * 100;

  const handleSelectOption = (index) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = index;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (userAnswers[currentIndex] === null) return; // Prevent next if no option selected
    
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setUserAnswers(Array(QUIZ_QUESTIONS.length).fill(null));
    setIsFinished(false);
  };

  return (
    <AnimatePresence>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 230, 118, 0.4);
        }
      `}</style>

      {/* 1. Absolute Background Overlay */}
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-hidden"
        style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          backgroundColor: 'rgba(11, 14, 17, 0.85)', backdropFilter: 'blur(12px)', overflow: 'hidden' 
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        dir="rtl"
      >
        {/* 2. Main Modal Card Container */}
        <motion.div 
          className="relative w-full max-w-2xl h-[85vh] flex flex-col bg-neutral-950 border border-white/[0.06] rounded-2xl p-6 shadow-2xl glass-card"
          style={{ 
            position: 'relative', width: '100%', maxWidth: '650px', height: '85vh', 
            display: 'flex', flexDirection: 'column',
            backgroundColor: '#0b0e11', borderColor: 'rgba(255,255,255,0.06)', borderWidth: '1px', borderStyle: 'solid',
            borderRadius: '16px', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="position-absolute btn btn-link text-muted p-2 interactive"
            style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, textDecoration: 'none' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
          </button>

          {!isFinished ? (
            // Quiz View Structure
            <div className="d-flex flex-column h-100" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className="flex-shrink-0 mb-4" style={{ flexShrink: 0 }}>
                {/* Progress Bar */}
                <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', width: '100%', borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div 
                    style={{ height: '100%', backgroundColor: '#00e676', boxShadow: '0 0 10px rgba(0, 230, 118, 0.5)' }}
                    initial={{ width: `${((currentIndex) / totalQuestions) * 100}%` }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <div className="d-flex align-items-center gap-2 mt-4 mb-2">
                  <span className="material-symbols-outlined" style={{ color: '#00e676' }}>quiz</span>
                  <span className="text-muted font-mono-data" style={{ fontSize: '13px' }}>سؤال {currentIndex + 1} من {totalQuestions}</span>
                </div>
                <h3 className="text-white m-0" style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', lineHeight: 1.6 }}>
                  {currentQ.question}
                </h3>
              </div>

              {/* Scrollable Questions Area */}
              <div className="flex-1 overflow-y-auto mt-2 pr-2 custom-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                <div className="d-flex flex-column gap-3 py-2">
                  {currentQ.options.map((option, idx) => {
                    const isSelected = userAnswers[currentIndex] === idx;
                    let itemStyle = {
                      borderColor: isSelected ? '#00e676' : 'rgba(255,255,255,0.08)',
                      backgroundColor: isSelected ? 'rgba(0, 230, 118, 0.04)' : 'rgba(255,255,255,0.02)',
                      color: 'var(--text-primary)',
                      boxShadow: isSelected ? '0 0 15px rgba(0, 230, 118, 0.1)' : 'none'
                    };

                    return (
                      <motion.button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className="btn text-start p-3 rounded-3 d-flex justify-content-between align-items-center hover-glow"
                        style={{
                          ...itemStyle,
                          borderStyle: 'solid',
                          borderWidth: '1px',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '15px',
                          transition: 'all 0.3s ease'
                        }}
                        whileHover={!isSelected ? { scale: 1.01, borderColor: 'rgba(0, 230, 118, 0.5)' } : {}}
                        whileTap={{ scale: 0.99 }}
                      >
                        <span>{option}</span>
                        {isSelected && (
                          <motion.span 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="material-symbols-outlined" 
                            style={{ color: '#00e676', fontSize: '20px' }}
                          >
                            radio_button_checked
                          </motion.span>
                        )}
                        {!isSelected && (
                           <span className="material-symbols-outlined text-muted" style={{ fontSize: '20px', opacity: 0.3 }}>
                             radio_button_unchecked
                           </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-shrink-0 mt-4 pt-3 border-top d-flex justify-content-end" style={{ flexShrink: 0, borderColor: 'rgba(255,255,255,0.06)' }}>
                <button 
                  onClick={handleNext}
                  disabled={userAnswers[currentIndex] === null}
                  className="btn px-4 py-2 fw-bold"
                  style={{
                    backgroundColor: userAnswers[currentIndex] !== null ? '#00e676' : 'rgba(255,255,255,0.1)',
                    color: userAnswers[currentIndex] !== null ? '#003918' : 'rgba(255,255,255,0.4)',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-sans)',
                    boxShadow: userAnswers[currentIndex] !== null ? '0 0 15px rgba(0, 230, 118, 0.3)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {currentIndex < totalQuestions - 1 ? 'السؤال التالي' : 'إنهاء الاختبار وتقديم الإجابات'}
                </button>
              </div>
            </div>
          ) : (
            // Final Evaluation Structure
            <div className="d-flex flex-column h-100 w-100" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              
              {/* 3. Quiz Results Header Section */}
              <div className="flex-shrink-0 text-center w-100 mb-2 d-flex flex-column align-items-center" style={{ flexShrink: 0 }}>
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center mb-3 mt-3"
                  style={{ 
                    width: '64px', 
                    height: '64px', 
                    backgroundColor: percentageScore >= 80 ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 213, 79, 0.1)',
                    color: percentageScore >= 80 ? '#00e676' : '#ffd54f',
                    boxShadow: percentageScore >= 80 ? '0 0 30px rgba(0, 230, 118, 0.2)' : '0 0 30px rgba(255, 213, 79, 0.2)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                    {percentageScore >= 80 ? 'workspace_premium' : 'psychology'}
                  </span>
                </div>
                
                <h2 className="text-white mb-2 fw-bold" style={{ fontFamily: 'var(--font-sans)' }}>نتيجة الاختبار</h2>
                <p className="font-mono-data mb-3" style={{ fontSize: '20px', color: 'var(--text-primary)' }}>
                  حصلت على <span style={{ color: percentageScore >= 80 ? '#00e676' : '#ffd54f' }}>{score}</span> من {totalQuestions}
                </p>

                {percentageScore >= 80 ? (
                  <div className="badge py-2 px-4 mb-3" style={{ backgroundColor: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.4)', color: '#00e676', fontSize: '13px', fontFamily: 'var(--font-sans)', boxShadow: '0 0 15px rgba(0, 230, 118, 0.2)' }}>
                    ممتاز! أنت مستعد للتداول الحقيقي
                  </div>
                ) : (
                  <div className="badge py-2 px-4 mb-3" style={{ backgroundColor: 'rgba(255, 213, 79, 0.1)', border: '1px solid rgba(255, 213, 79, 0.4)', color: '#ffd54f', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
                    مراجعة جيدة، تحتاج لتركيز إضافي
                  </div>
                )}
                
                <div className="w-100 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.06)' }}></div>
              </div>

              {/* 4. Review Content Area */}
              <div className="flex-1 overflow-y-auto mt-3 space-y-6 pr-2 custom-scrollbar w-100 text-end" style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                <h4 className="text-white mb-4 mt-2 fw-bold" style={{ fontFamily: 'var(--font-sans)', fontSize: '16px' }}>مراجعة الإجابات والتصحيح</h4>
                
                <div className="d-flex flex-column gap-4 pb-4">
                  {QUIZ_QUESTIONS.map((q, i) => {
                    const userAnswer = userAnswers[i];
                    return (
                      <div key={q.id} className="p-4 rounded-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h5 className="text-white mb-4" style={{ fontSize: '14px', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>
                          {i + 1}. {q.question}
                        </h5>
                        <div className="d-flex flex-column gap-2">
                          {q.options.map((opt, optIdx) => {
                            const isUserChoice = userAnswer === optIdx;
                            const isActualCorrect = q.correctAnswer === optIdx;
                            
                            let itemStyle = {
                              borderColor: 'rgba(255,255,255,0.05)',
                              backgroundColor: 'transparent',
                              color: 'rgba(255,255,255,0.6)'
                            };

                            if (isActualCorrect) {
                              itemStyle = {
                                borderColor: '#00e676',
                                backgroundColor: 'rgba(0, 230, 118, 0.08)',
                                color: '#00e676',
                                boxShadow: '0 0 10px rgba(0, 230, 118, 0.1)'
                              };
                            } else if (isUserChoice && !isActualCorrect) {
                              itemStyle = {
                                borderColor: '#ff5252',
                                backgroundColor: 'rgba(255, 82, 82, 0.08)',
                                color: '#ff5252'
                              };
                            }

                            return (
                              <div key={optIdx} className="p-3 rounded-3 d-flex justify-content-between align-items-center" style={{ ...itemStyle, borderStyle: 'solid', borderWidth: '1px', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
                                <span>{opt}</span>
                                {isActualCorrect && <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>}
                                {isUserChoice && !isActualCorrect && <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cancel</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex-shrink-0 d-flex flex-column flex-md-row gap-3 w-100 mt-4 pt-4 border-top" style={{ flexShrink: 0, borderColor: 'rgba(255,255,255,0.06)' }}>
                <button 
                  onClick={handleRetake}
                  className="btn py-2 fw-bold interactive flex-grow-1"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                >
                  إعادة الاختبار
                </button>
                <button 
                  onClick={onClose}
                  className="btn py-2 fw-bold btn-primary-cta flex-grow-1"
                  style={{ borderRadius: '8px' }}
                >
                  إغلاق
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
