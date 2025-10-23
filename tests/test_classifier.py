from smilemap.classifier import PracticeStatus, StatusClassifier


def test_classifier_detects_green_signal():
    classifier = StatusClassifier()
    result = classifier.classify("We are currently accepting NHS patients.")
    assert result.status == PracticeStatus.GREEN
    assert result.confidence >= 0.5


def test_classifier_detects_red_signal():
    classifier = StatusClassifier()
    result = classifier.classify("We are not accepting NHS patients at this time.")
    assert result.status == PracticeStatus.RED


def test_classifier_handles_no_signal():
    classifier = StatusClassifier()
    result = classifier.classify("Contact us for more information about appointments.")
    assert result.status == PracticeStatus.GREY
