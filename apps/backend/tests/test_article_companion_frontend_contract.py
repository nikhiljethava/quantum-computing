"""Source contracts for the article companion, Quick Assessment, and trust-first UI."""

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


def _read(relative_path: str) -> str:
    return (REPO_ROOT / relative_path).read_text(encoding="utf-8")


def test_homepage_has_three_new_entry_paths_and_accurate_concepts() -> None:
    source = _read("apps/frontend/src/app/page.tsx")

    assert "Independent personal project. Not an official Google product. Simulator-first." in source
    assert 'href: "/series"' in source
    assert 'href: "/learn/quantum-software-stack"' in source
    assert 'href: "/assess"' in source
    assert "Explore the series" in source
    assert "Explore the software stack" in source
    assert "Start an assessment" in source
    assert "controlling how those amplitudes interfere before measurement" in source
    assert "do not transmit information faster than light" in source
    assert "suitable reversible oracle must exist" in source
    assert "building the oracle and loading the data still matters" in source
    assert "trying every answer at once" not in source


def test_quick_assessment_is_non_authoritative_and_hands_off_to_full_qals() -> None:
    quick = _read("apps/frontend/src/components/assessment/QuickAssessment.tsx")
    assess = _read("apps/frontend/src/app/assess/page.tsx")

    for prompt in [
        "What problem are you trying to solve?",
        "Which broad problem class fits best?",
        "How is it solved today?",
        "What outcome or value matters?",
        "Does a mathematical model or structured input exist?",
        "What time horizon matters?",
        "What is the goal?",
    ]:
        assert prompt in quick

    assert "Cannot unlock Build" in quick
    assert "never creates a contract, score, verdict, or serious Build eligibility" in quick
    assert "useCreateAssessment" not in quick
    assert "createAlgorithmContract" not in quick
    assert "Continue to Full Algorithm Contract" in quick
    assert "Quick Assessment" in assess
    assert "Full Algorithm Contract" in assess
    assert "{ ...defaultInputs(null), ...quickInputs }" in assess
    assert "preserveQuickHandoff" in assess
    assert "useCreateAssessment" in assess
    assert "QALS 3.0" in assess


def test_assessment_result_hierarchy_keeps_score_last() -> None:
    source = _read("apps/frontend/src/app/assess/page.tsx")
    ordered_tokens = [
        ">Verdict<",
        "Recommended contract type",
        "Algorithm family",
        "Confidence:",
        "Time horizon:",
        "Build eligibility:",
        "TrustLabels labels={result.trust_labels}",
        "Plain-English recommendation",
        'title="Missing evidence"',
        'title="Classical baseline"',
        'title="Assumptions"',
        'title="Caveats"',
        "Next best action",
        "Readiness score is secondary",
    ]
    positions = [source.index(token) for token in ordered_tokens]

    assert positions == sorted(positions)


def test_series_content_model_and_routes_cover_articles_one_and_two() -> None:
    content = _read("apps/frontend/src/content/series.ts")
    route = _read("apps/frontend/src/app/series/[slug]/page.tsx")
    hub = _read("apps/frontend/src/app/series/page.tsx")

    assert "interface SeriesArticle" in content
    assert "interface ArticleCompanion" in content
    assert "interface EvidenceRecord" in content
    assert 'slug: "01-platform-problem"' in content
    assert 'slug: "02-hybrid-computing"' in content
    assert "Quantum Computing Has a Platform Problem" in content
    assert "Why Quantum Computing Will Be Hybrid" in content
    assert "NEXT_PUBLIC_SERIES_ARTICLE_01_URL" in content
    assert "NEXT_PUBLIC_SERIES_ARTICLE_02_URL" in content
    assert "returnTo" not in content
    assert "generateStaticParams" in route
    assert "getSeriesCompanion" in route
    assert "SERIES_ARTICLES.map" in hub


def test_series_interactions_are_keyboard_semantic_and_tutorial_labeled() -> None:
    source = _read("apps/frontend/src/components/series/SeriesCompanionExperience.tsx")
    content = _read("apps/frontend/src/content/series.ts")

    assert 'aria-pressed={selected.id === layer.id}' in source
    assert 'aria-label="Quantum platform layers"' in source
    assert 'aria-label="Hybrid interaction models"' in source
    assert "<details" in source
    assert "Tutorial mode" in source
    assert "toy simulation" in source.lower()
    for model in ["Batch", "Iterative", "Tight or real-time", "Future integrated"]:
        assert model in content
    for layer in [
        "Problem definition",
        "Algorithm Contract",
        "Libraries and compiler",
        "Hybrid runtime",
        "CPU, GPU, simulator, and QPU",
        "Control and error management",
        "Evidence and decision",
    ]:
        assert layer in content


def test_software_stack_page_is_focused_and_cirq_first() -> None:
    source = _read("apps/frontend/src/app/learn/quantum-software-stack/page.tsx")

    for layer in [
        "Framework",
        "Domain library",
        "Compiler and intermediate representation",
        "Simulator",
        "Runtime and backend",
        "QPU",
    ]:
        assert layer in source
    assert "Cirq remains the supported execution path" in source
    assert "does not claim to execute them" in source
    assert "not a ranking or marketplace" in source
    assert "Simple first, detail on demand" in source
    assert "Trust check" in source


def test_map_exposes_reference_and_cloud_implementation_views() -> None:
    source = _read("apps/frontend/src/app/map/page.tsx")

    assert "Reference architecture" in source
    assert "Cloud implementation example" in source
    assert "without prescribing a vendor" in source
    assert "not an official Google quantum product or universal reference architecture" in source
    assert "referenceNodeName" in source
    assert "component.service" in source


def test_analytics_is_typed_and_deep_link_inputs_are_allowlisted() -> None:
    analytics = _read("apps/frontend/src/lib/analytics.ts")
    assess = _read("apps/frontend/src/app/assess/page.tsx")

    for event in [
        "series_hub_viewed",
        "article_companion_viewed",
        "companion_layer_opened",
        "guided_example_started",
        "quick_assessment_started",
        "quick_assessment_completed",
        "full_contract_started",
        "contract_created",
        "experiment_started",
        "experiment_completed",
        "decision_brief_exported",
        "return_to_article_clicked",
    ]:
        assert f'| "{event}"' in analytics or f'= "{event}"' in analytics

    build = _read("apps/frontend/src/app/build/page.tsx")
    usage = _read("apps/backend/src/foundry_backend/api/v1/routes/usage.py")
    assert 'trackProductEvent("guided_example_completed"' in build
    assert 'requestedSource === "series-01" || requestedSource === "series-02"' in build
    assert 'PageUsage.page_path.not_like("/__events__/%")' in usage
    assert 'new Set(["series-01", "series-02"])' in assess
    assert "safeProblemClass" in assess
    assert "safeQuickGoal" in assess
    assert "returnTo" not in assess
