
import React from 'react';
import { Exam } from '../types';

interface ExamPaperProps {
  exam: Exam;
}

export const ExamPaper: React.FC<ExamPaperProps> = ({ exam }) => {
  return (
    <div className="bg-white p-12 max-w-[210mm] min-h-[297mm] mx-auto shadow-xl print:shadow-none print:p-0 border border-slate-200 print:border-none">
      {/* Header */}
      <div className="border-2 border-black p-4 mb-8">
        <div className="flex justify-between items-start border-b border-black pb-4 mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold uppercase">{exam.schoolName}</h1>
            <p className="text-sm">Professor(a): {exam.teacherName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">DATA: ____/____/____</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm">ALUNO(A): ________________________________________________</p>
          </div>
          <div className="text-right">
            <p className="text-sm">TURMA: _________ | NOTA: _________</p>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold underline uppercase">{exam.title}</h2>
        <p className="text-sm mt-2 italic">{exam.subject} - {exam.grade}</p>
      </div>

      {/* Instructions */}
      {exam.instructions && (
        <div className="bg-slate-50 border border-slate-300 p-4 mb-8 text-sm print:bg-transparent">
          <p className="font-bold mb-1">INSTRUÇÕES:</p>
          <p className="whitespace-pre-line">{exam.instructions}</p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-8">
        {exam.questions.map((q, idx) => (
          <div key={q.id} className="break-inside-avoid">
            <p className="font-bold text-lg mb-3">
              QUESTÃO {idx + 1}:
            </p>
            <p className="mb-4 text-justify leading-relaxed">
              {q.question}
            </p>
            
            {q.type === 'multiple' && q.options && (
              <div className="grid grid-cols-1 gap-2 ml-4">
                {q.options.map((opt, oIdx) => (
                  <label key={oIdx} className="flex items-start gap-2">
                    <span className="font-semibold">{String.fromCharCode(65 + oIdx)})</span>
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}
            
            {q.type === 'open' && (
              <div className="mt-4 space-y-4">
                <div className="border-b border-dotted border-black h-8"></div>
                <div className="border-b border-dotted border-black h-8"></div>
                <div className="border-b border-dotted border-black h-8"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
