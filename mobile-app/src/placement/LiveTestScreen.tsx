import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import { ErrorBlock } from "@/components/learning/LearningStates";
import { TestButton, TestLoading } from "@/components/learning/test/TestKit";
import { useTheme } from "@/theme";
import { notify, confirmAction } from "@/lib/notify";
import { useTestDetail, useTestQuestions, useSubmitTestAttempt } from "@/hooks/usePlacement";
import type { PlacementStackParamList, TestAttemptAnswer } from "@/types";

type Rte = RouteProp<PlacementStackParamList, "LiveTest">;

function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function LiveTestScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: test } = useTestDetail(params.testId);
  const { data: questions, isLoading, isError, refetch } = useTestQuestions(params.testId);
  const submitAttempt = useSubmitTestAttempt(params.testId);
  const { colors, type } = useTheme();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const startTimeRef = useRef(Date.now());
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (test && secondsLeft === null) setSecondsLeft(test.durationMinutes * 60);
  }, [test, secondsLeft]);

  const handleSubmit = useMemo(
    () => async () => {
      if (hasSubmittedRef.current || !questions) return;
      hasSubmittedRef.current = true;
      const answerList: TestAttemptAnswer[] = questions.map((q) => ({
        questionId: q.id,
        selectedIndex: answers[q.id] ?? null,
      }));
      const timeTakenSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      try {
        const result = await submitAttempt.mutateAsync({ answers: answerList, timeTakenSeconds });
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "TestResult" as never, params: { attemptId: result.attemptId } as never }],
          })
        );
      } catch (error: any) {
        hasSubmittedRef.current = false;
        notify("Couldn't submit test", error.message ?? "Please try again.");
      }
    },
    [answers, questions, submitAttempt, navigation]
  );

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => (s ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, handleSubmit]);

  if (isLoading || !questions) return <Screen themed className="items-center justify-center"><TestLoading label="Loading questions..." /></Screen>;
  if (isError || questions.length === 0) return <Screen themed className="items-center justify-center px-6"><ErrorBlock what="test questions" onRetry={refetch} /></Screen>;

  const question = questions[currentIndex];
  const selected = answers[question.id];

  const confirmSubmit = () => {
    const unanswered = questions.length - Object.keys(answers).length;
    confirmAction(
      "Submit Test?",
      unanswered > 0 ? `You have ${unanswered} unanswered question(s). Submit anyway?` : "Are you sure you want to submit?",
      handleSubmit,
      "Submit"
    );
  };

  return (
    <Screen themed className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-3">
        <Text style={[type.title, { color: colors.text, flex: 1, marginRight: 8 }]} numberOfLines={1}>{test?.title}</Text>
        <View className="flex-row items-center rounded-full px-3 py-1" style={{ backgroundColor: colors.dangerSoft }}>
          <Ionicons name="time-outline" size={14} color={colors.danger} />
          <Text style={[type.caption, { color: colors.danger, marginLeft: 4 }]}>{formatSeconds(secondsLeft ?? 0)}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" style={{ maxHeight: 44 }}>
        {questions.map((q, index) => {
          const isAnswered = answers[q.id] !== undefined;
          const isActive = index === currentIndex;
          return (
            <Pressable
              key={q.id}
              onPress={() => setCurrentIndex(index)}
              className="w-9 h-9 rounded-full items-center justify-center mr-2"
              style={{
                backgroundColor: isActive ? colors.primaryFill : isAnswered ? colors.successSoft : colors.surface,
                borderWidth: isActive ? 0 : 1,
                borderColor: isAnswered ? colors.success : colors.border,
              }}
            >
              <Text style={[type.label, { color: isActive ? colors.textOnPrimary : isAnswered ? colors.success : colors.textSecondary }]}>
                {index + 1}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[type.caption, { color: colors.textSecondary, marginBottom: 4 }]}>
        Q.{currentIndex + 1} · {question.marks} Mark{question.marks !== 1 ? "s" : ""}
      </Text>
      <Text style={[type.title, { color: colors.text, marginBottom: 20 }]}>{question.questionText}</Text>

      {question.options.map((option, index) => {
        const isSelected = selected === index;
        return (
          <Pressable
            key={index}
            onPress={() => setAnswers((prev) => ({ ...prev, [question.id]: index }))}
            className="flex-row items-center border rounded-xl px-4 py-3.5 mb-3"
            style={{ borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.primarySoft : colors.surface }}
          >
            <View
              className="w-6 h-6 rounded-full items-center justify-center mr-3"
              style={{ borderWidth: 1.5, borderColor: isSelected ? colors.primaryFill : colors.textMuted, backgroundColor: isSelected ? colors.primaryFill : "transparent" }}
            >
              {isSelected && <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} />}
            </View>
            <Text style={[type.small, { flex: 1, fontSize: 15, lineHeight: 22, color: isSelected ? colors.primaryText : colors.text }]}>{option}</Text>
          </Pressable>
        );
      })}

      <View className="flex-1" />
      <View className="flex-row items-center justify-between py-4" style={{ gap: 10 }}>
        <TestButton label="Previous" variant="outline" style={{ flex: 1 }} disabled={currentIndex === 0} onPress={() => setCurrentIndex((i) => i - 1)} />
        {currentIndex === questions.length - 1 ? (
          <TestButton label="Submit" style={{ flex: 1 }} loading={submitAttempt.isPending} onPress={confirmSubmit} />
        ) : (
          <TestButton label="Next" style={{ flex: 1 }} onPress={() => setCurrentIndex((i) => i + 1)} />
        )}
      </View>
    </Screen>
  );
}

export default LiveTestScreen;
