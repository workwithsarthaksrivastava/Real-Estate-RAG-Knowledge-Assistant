import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Clock,
  ArrowRight,
  Sliders,
  Zap,
  TrendingUp,
  Scale,
  Home,
  Brain,
  RotateCcw,
  Download,
  Info,
  X,
  Bot,
} from 'lucide-react';
import {
  ChatMessage,
  SourceCitation,
  ChatbotRole,
  ReasoningMode,
  ChatRequestOptions,
} from '../types/rag';
import { FormattedMessage } from './FormattedMessage';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (query: string, options?: ChatRequestOptions) => void;
  onSelectCitation: (citation: SourceCitation) => void;
  selectedProperty: string;
  onFeedback: (messageId: string, feedback: 'helpful' | 'unhelpful') => void;
  onClearChat?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onSelectCitation,
  selectedProperty,
  onFeedback,
  onClearChat,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<ChatbotRole>('verification');
  const [reasoningMode, setReasoningMode] = useState<ReasoningMode>('balanced');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim(), {
      role: activeRole,
      mode: reasoningMode,
      customSystemInstruction: activeRole === 'custom' ? customPrompt : undefined,
    });
    setInput('');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const transcript = messages
      .map(
        (m) =>
          `[${m.timestamp}] ${m.role.toUpperCase()}:\n${m.content}\n${
            m.ragResponse?.citations
              ? `\nCitations:\n` +
                m.ragResponse.citations
                  .map((c) => `- ${c.document_name} (P.${c.page_number}, ${c.section})`)
                  .join('\n')
              : ''
          }\n`
      )
      .join('\n---\n\n');

    const blob = new Blob([transcript], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estate-chat-transcript-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const rolesConfig = [
    {
      id: 'verification' as ChatbotRole,
      label: 'Verification Specialist',
      shortLabel: 'Verification',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
      description: 'Strict grounded facts directly from brochures, contracts, and filings.',
      starterQuestions: [
        'When is Phase 2 possession for Green Valley?',
        'What is the carpet area of the 3 BHK Premium?',
        'Does Green Valley Residency have a swimming pool?',
        'What is the RERA number for Skyline Heights?',
      ],
    },
    {
      id: 'investment' as ChatbotRole,
      label: 'Investment & Financial Analyst',
      shortLabel: 'Investment',
      icon: <TrendingUp className="w-3.5 h-3.5 text-sky-400" />,
      description: 'Analyzes unit pricing, rate/sqft, CLP payment milestones, and comparative valuations.',
      starterQuestions: [
        'What is the starting price and price/sqft of the 2 BHK in Green Valley?',
        'What is the Construction-Linked Payment (CLP) schedule for Phase 2?',
        'Compare pricing between Green Valley and Skyline Heights',
        'What are the booking amounts and milestone percentages?',
      ],
    },
    {
      id: 'legal_rera' as ChatbotRole,
      label: 'Legal & RERA Specialist',
      shortLabel: 'Legal & RERA',
      icon: <Scale className="w-3.5 h-3.5 text-amber-400" />,
      description: 'Examines statutory RERA disclosures, possession revisions, and approval statuses.',
      starterQuestions: [
        'Are there any conflicting possession dates across Green Valley updates?',
        'Which banks have approved loans for Green Valley Residency?',
        'What is the exact RERA registration status and expiry for Skyline Heights?',
        'Who is the richest real estate developer in India?', // Out of scope test
      ],
    },
    {
      id: 'concierge' as ChatbotRole,
      label: 'Homebuyer Concierge',
      shortLabel: 'Concierge',
      icon: <Home className="w-3.5 h-3.5 text-purple-400" />,
      description: 'Warm consultative guide for floor plan layouts, clubhouse lifestyle, and transit proximity.',
      starterQuestions: [
        'What amenities are included in Club Verdant at Green Valley?',
        'How far is Green Valley from the international airport and metro?',
        'What are the differences between 2 BHK Classic and 3 BHK Premium layouts?',
        'What is the pet policy and power backup arrangement?',
      ],
    },
  ];

  const currentRoleObj = rolesConfig.find((r) => r.id === activeRole) || rolesConfig[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden relative">
      {/* Top Multi-turn Controls: Role Selector & Reasoning Mode */}
      <div className="px-4 py-2.5 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
        {/* Role Selector Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Role:
          </span>
          {rolesConfig.map((role) => {
            const isSelected = activeRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 border border-transparent'
                }`}
                title={role.description}
              >
                {role.icon}
                <span>{role.shortLabel}</span>
              </button>
            );
          })}

          <button
            onClick={() => setIsSystemModalOpen(true)}
            className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              activeRole === 'custom' || customPrompt
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
            title="Custom System Instruction & Model Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Intelligence / Reasoning Mode Selector & Export */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setReasoningMode('fast')}
              className={`px-2 py-0.5 rounded-md flex items-center space-x-1 transition-all cursor-pointer ${
                reasoningMode === 'fast'
                  ? 'bg-neutral-800 text-amber-300 font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Fast Mode (Low Latency Instant Query Response)"
            >
              <Zap className="w-3 h-3" />
              <span className="hidden md:inline">Fast</span>
            </button>
            <button
              onClick={() => setReasoningMode('balanced')}
              className={`px-2 py-0.5 rounded-md flex items-center space-x-1 transition-all cursor-pointer ${
                reasoningMode === 'balanced'
                  ? 'bg-neutral-800 text-amber-300 font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Balanced Intelligence (Optimal for General Grounded Synthesis)"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden md:inline">Balanced</span>
            </button>
            <button
              onClick={() => setReasoningMode('complex')}
              className={`px-2 py-0.5 rounded-md flex items-center space-x-1 transition-all cursor-pointer ${
                reasoningMode === 'complex'
                  ? 'bg-neutral-800 text-amber-300 font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Deep Reasoning (Complex Cross-Document Analysis & Comparisons)"
            >
              <Brain className="w-3 h-3" />
              <span className="hidden md:inline">Deep Analysis</span>
            </button>
          </div>

          {messages.length > 0 && (
            <>
              <button
                onClick={handleExportChat}
                className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700 text-neutral-300 hover:text-neutral-100 transition-colors cursor-pointer"
                title="Export chat transcript"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              {onClearChat && (
                <button
                  onClick={onClearChat}
                  className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700 text-neutral-300 hover:text-neutral-100 transition-colors cursor-pointer"
                  title="Clear conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Messages Scrollable Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-4 text-center space-y-6">
            <div className="inline-flex p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-amber-400 shadow-inner">
              <Bot className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-neutral-100 tracking-tight">
                Multi-Turn Grounded Real Estate Assistant
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
                Ask multi-turn questions with conversational memory. Every answer is grounded
                strictly in verified property brochures, floor plans, pricing sheets, and schedule updates.
              </p>
            </div>

            {/* Current Role Info Banner */}
            <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 max-w-lg mx-auto text-left flex items-start space-x-3">
              <div className="mt-0.5">{currentRoleObj.icon}</div>
              <div>
                <div className="text-xs font-semibold text-neutral-200">
                  Active Persona: {currentRoleObj.label}
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {currentRoleObj.description}
                </div>
              </div>
            </div>

            {/* Suggested Starter Prompts for Active Role */}
            <div className="pt-2 text-left">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  Suggested Prompts ({currentRoleObj.shortLabel})
                </span>
                <span className="text-[10px] text-neutral-500 font-normal">
                  Multi-turn context preserved
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentRoleObj.starterQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(q, { role: activeRole, mode: reasoningMode })}
                    className="p-3 text-left rounded-xl bg-neutral-900/80 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 hover:text-neutral-100 transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <span className="line-clamp-2 pr-2">{q}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400 shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="max-w-3xl mx-auto space-y-3">
              {msg.role === 'user' ? (
                // User Message Bubble
                <div className="flex justify-end">
                  <div className="max-w-xl px-4 py-2.5 rounded-2xl rounded-tr-sm bg-neutral-800 text-neutral-100 text-sm leading-relaxed border border-neutral-700/80 shadow-sm">
                    {msg.content}
                    {msg.propertyContext && (
                      <div className="text-[10px] text-amber-400/80 mt-1 font-mono">
                        Scope: {msg.propertyContext}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Assistant Grounded Response Card
                <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-5 space-y-4 shadow-md">
                  {/* Header: Confidence, Role Badge & Source Count */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-neutral-800/80">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      {msg.ragResponse?.is_refusal ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Refusal Safeguard Active
                        </span>
                      ) : msg.ragResponse?.confidence === 'HIGH' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Grounded ({((msg.ragResponse?.confidence_score || 0.85) * 100).toFixed(0)}%)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Moderate Match
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-800 border border-neutral-700 text-neutral-300 font-medium capitalize">
                        {msg.roleBadge || activeRole}
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                      <span>{msg.ragResponse?.metrics?.total_time_ms ?? 0}ms</span>
                      <span>•</span>
                      <span>{msg.ragResponse?.citations?.length || 0} citations</span>
                    </div>
                  </div>

                  {/* Conflict Notice Warning Banner */}
                  {msg.ragResponse?.conflicts && msg.ragResponse.conflicts.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                      <div className="flex items-center space-x-2 font-semibold text-amber-300">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Conflicting Document Versions Detected</span>
                      </div>
                      <div className="text-neutral-300 leading-relaxed space-y-1">
                        {msg.ragResponse.conflicts.map((conf, idx) => (
                          <div key={idx} className="bg-neutral-950/60 p-2.5 rounded-lg border border-amber-500/20">
                            <p className="font-medium text-amber-200 mb-1">{conf.summary}</p>
                            <ul className="list-disc list-inside text-neutral-400 space-y-0.5 text-[11px]">
                              {conf.sources.map((s, si) => (
                                <li key={si}>
                                  <span className="text-neutral-300 font-medium">{s.document_name}</span> (Page {s.page_number}
                                  {s.publication_date ? `, ${s.publication_date}` : ''}): <span className="text-amber-300 font-mono">"{s.value}"</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Answer Text */}
                  <FormattedMessage content={msg.content} />

                  {/* Traceable Citations Pills */}
                  {msg.ragResponse?.citations && msg.ragResponse.citations.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-amber-400" />
                        <span>Traceable Sources & Evidence</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.ragResponse.citations.map((cite) => (
                          <button
                            key={cite.citation_id}
                            onClick={() => onSelectCitation(cite)}
                            className="px-2.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/80 text-xs text-neutral-300 hover:text-amber-300 transition-all flex items-center space-x-1.5 cursor-pointer group"
                            title="Click to inspect verified source chunk in side drawer"
                          >
                            <span className="font-medium truncate max-w-[200px]">
                              {cite.document_name}
                            </span>
                            <span className="text-neutral-500">•</span>
                            <span className="text-neutral-400 font-mono text-[10px]">
                              P.{cite.page_number}
                            </span>
                            <ExternalLink className="w-3 h-3 text-neutral-500 group-hover:text-amber-400 ml-1" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Bar (Copy & Helpful Feedback) */}
                  <div className="flex items-center justify-between pt-2 text-xs text-neutral-500 border-t border-neutral-800/60">
                    <span className="text-[11px]">
                      {msg.timestamp}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="p-1.5 hover:text-neutral-200 rounded hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[11px]">{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => onFeedback(msg.id, 'helpful')}
                        className={`p-1.5 rounded hover:bg-neutral-800 transition-colors cursor-pointer ${
                          msg.feedback === 'helpful' ? 'text-emerald-400' : 'hover:text-neutral-200'
                        }`}
                        title="Helpful & grounded"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onFeedback(msg.id, 'unhelpful')}
                        className={`p-1.5 rounded hover:bg-neutral-800 transition-colors cursor-pointer ${
                          msg.feedback === 'unhelpful' ? 'text-rose-400' : 'hover:text-neutral-200'
                        }`}
                        title="Unhelpful or inaccurate"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-5 space-y-3 animate-pulse">
              <div className="flex items-center space-x-2 text-xs text-amber-400 font-medium">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Processing multi-turn context & retrieving verified documents...</span>
              </div>
              <div className="h-4 bg-neutral-800 rounded w-3/4"></div>
              <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Prompt Area */}
      <div className="p-4 border-t border-neutral-800 bg-neutral-900/90 backdrop-blur-md">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
          <div className="flex items-center space-x-2 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 focus-within:border-amber-500/60 transition-all shadow-lg">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                selectedProperty !== 'All Properties'
                  ? `Ask ${currentRoleObj.label.toLowerCase()} about ${selectedProperty}...`
                  : `Ask ${currentRoleObj.label.toLowerCase()} (floor plans, pricing, possession, RERA)...`
              }
              className="flex-1 bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-neutral-950 font-medium transition-all cursor-pointer shadow"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-2 px-1">
            <span>
              Scope: <strong className="text-neutral-400 font-medium">{selectedProperty}</strong>
            </span>
            <span>Multi-turn Conversation • Strict Grounding</span>
          </div>
        </form>
      </div>

      {/* Custom System Instruction Modal */}
      {isSystemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold text-neutral-100">
                  Custom System Instructions & Role Persona
                </h3>
              </div>
              <button
                onClick={() => setIsSystemModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Tailor the behavior of the conversational assistant. You can specify a custom system instruction for custom property evaluations (e.g. prioritizing NRI investment tax rules, commercial leasing, or corner unit layouts).
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Custom System Prompt
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., You are a senior real estate acquisition consultant specializing in NRI taxation and high-yield residential leasing..."
                rows={5}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500/60 font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setCustomPrompt('');
                  setActiveRole('verification');
                  setIsSystemModalOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Reset to Default
              </button>
              <button
                onClick={() => {
                  if (customPrompt.trim().length > 0) {
                    setActiveRole('custom');
                  }
                  setIsSystemModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold transition-colors cursor-pointer"
              >
                Save & Apply Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
