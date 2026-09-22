import { EvaluationTestCase, EvaluationResult, RAGResponse } from './types.js';

export const EVALUATION_DATASET: EvaluationTestCase[] = [
  {
    id: "test_1_exact_factual",
    category: "exact_factual",
    question: "What is the carpet area of the 3 BHK in Green Valley Residency?",
    property_context: "Green Valley Residency",
    expected_answer_keywords: ["1,420", "carpet area"],
    should_refuse: false,
    description: "Exact factual question requesting verified carpet area specification."
  },
  {
    id: "test_2_pricing",
    category: "pricing",
    question: "What is the starting price of the 2 BHK in Green Valley Residency?",
    property_context: "Green Valley Residency",
    expected_answer_keywords: ["95 lakh", "2 BHK"],
    should_refuse: false,
    description: "Pricing query for base selling price of 2 BHK unit."
  },
  {
    id: "test_3_paraphrased",
    category: "paraphrased",
    question: "How far away is the airport from Green Valley?",
    property_context: "Green Valley Residency",
    expected_answer_keywords: ["28 km", "airport"],
    should_refuse: false,
    description: "Paraphrased natural language question on location connectivity."
  },
  {
    id: "test_4_amenity",
    category: "exact_factual",
    question: "Does Green Valley Residency have a swimming pool?",
    property_context: "Green Valley Residency",
    expected_answer_keywords: ["swimming pool", "50", "olympic"],
    should_refuse: false,
    description: "Amenity verification query checking verified facility records."
  },
  {
    id: "test_5_conflicting_possession",
    category: "conflicting",
    question: "When is Phase 2 possession for Green Valley Residency?",
    property_context: "Green Valley Residency",
    expected_answer_keywords: ["December 2026", "March 2027"],
    should_refuse: false,
    expected_conflict: true,
    description: "Detects discrepancy between January 2026 brochure and June 2026 schedule update."
  },
  {
    id: "test_6_multi_property",
    category: "multi_property",
    question: "Compare the 2 BHK configurations and prices between Green Valley and Skyline Heights.",
    expected_answer_keywords: ["Green Valley", "Skyline Heights", "95 lakh", "1.10 crore"],
    should_refuse: false,
    description: "Cross-property comparison synthesizing facts from multiple verified documents."
  },
  {
    id: "test_7_typo_query",
    category: "exact_factual",
    question: "Wht is the RERA registrtion numbr for Skyline Heights?",
    property_context: "Skyline Heights",
    expected_answer_keywords: ["PRM/TS/RERA/2023/1109"],
    should_refuse: false,
    description: "Handles spelling typos and retrieves exact legal RERA string via hybrid search."
  },
  {
    id: "test_8_missing_info_refusal",
    category: "missing_info",
    question: "Does Green Valley Residency have a private helicopter landing pad?",
    property_context: "Green Valley Residency",
    expected_answer_keywords: ["not available", "couldn't find", "not mentioned", "not found"],
    should_refuse: true,
    description: "Safeguard check: refuses claims on non-existent amenities."
  },
  {
    id: "test_9_unsupported_general_knowledge",
    category: "out_of_scope",
    question: "Who is the richest real estate developer in India?",
    expected_answer_keywords: ["not available", "property's knowledge base", "available property documents", "cannot answer"],
    should_refuse: true,
    description: "Strict boundary check: Refuses general LLM knowledge outside company property documents."
  },
  {
    id: "test_10_payment_plan",
    category: "exact_factual",
    question: "What is the payment plan for Phase 2 in Green Valley?",
    property_context: "Green Valley Residency",
    expected_answer_keywords: ["10%", "booking", "construction-linked"],
    should_refuse: false,
    description: "Verifies structured payment milestones and booking percentages."
  }
];

export class RAGEvaluator {
  public static evaluateCase(
    testCase: EvaluationTestCase,
    response: RAGResponse
  ): EvaluationResult {
    const answerLower = response.answer.toLowerCase();
    const passedKeywords = testCase.expected_answer_keywords.some((kw) =>
      answerLower.includes(kw.toLowerCase())
    );

    let passed = false;
    let notes = '';

    if (testCase.should_refuse) {
      if (response.is_refusal || response.confidence === 'LOW' || passedKeywords) {
        passed = true;
        notes = "Successfully refused unsupported/out-of-scope question.";
      } else {
        passed = false;
        notes = "Failed: Assistant answered ungrounded or out-of-scope question without refusal.";
      }
    } else if (testCase.expected_conflict) {
      const mentionsConflict =
        response.conflicts.length > 0 ||
        (answerLower.includes("december 2026") && answerLower.includes("march 2027")) ||
        answerLower.includes("conflict") ||
        answerLower.includes("differing") ||
        answerLower.includes("revised");
      if (mentionsConflict && passedKeywords) {
        passed = true;
        notes = "Successfully identified source conflict between brochure and schedule update.";
      } else {
        passed = false;
        notes = "Failed to flag date conflict between documents.";
      }
    } else {
      if (passedKeywords && !response.is_refusal && response.citations.length > 0) {
        passed = true;
        notes = `Passed with ${response.citations.length} grounded citations.`;
      } else if (passedKeywords) {
        passed = true;
        notes = "Keywords matched but citations count low.";
      } else {
        passed = false;
        notes = "Keywords missing from generated response.";
      }
    }

    return {
      test_case_id: testCase.id,
      question: testCase.question,
      category: testCase.category,
      passed,
      actual_answer: response.answer,
      confidence: response.confidence,
      refusal_matched: testCase.should_refuse ? passed : !response.is_refusal,
      keywords_matched: passedKeywords,
      citations_count: response.citations.length,
      latency_ms: response.metrics.total_time_ms,
      notes,
    };
  }
}
