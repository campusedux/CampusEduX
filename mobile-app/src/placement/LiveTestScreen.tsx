import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
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
        const targetRoute = test?.companyId ? "CompanyResult" : "TestResult";
        const targetParams = test?.companyId
          ? { attemptId: result.attemptId, companyId: test.companyId }
          : { attemptId: result.attemptId };
        navigation.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: targetRoute as never, params: targetParams as never }] })
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

  if (isLoading || !questions) return <Screen className="items-center justify-center"><LoadingState label="Loading questions..." /></Screen>;
  if (isError || questions.length === 0) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load test questions." onRetry={refetch} /></Screen>;

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
    <Screen className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-3">
        <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>{test?.title}</Text>
        <View className="flex-row items-center bg-red-50 rounded-full px-3 py-1">
          <Ionicons name="time-outline" size={14} color="#DC2626" />
          <Text className="text-danger text-xs font-semibold ml-1">{formatSeconds(secondsLeft ?? 0)}</Text>
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
                backgroundColor: isActive ? "#4F39F6" : isAnswered ? "#DCFCE7" : "#F3F4F6",
                borderWidth: isActive ? 0 : 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text className={isActive ? "text-white font-bold" : isAnswered ? "text-green-700 font-semibold" : "text-gray-500"}>
                {index + 1}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text className="text-gray-400 text-xs mb-1">
        Q.{currentIndex + 1} · {question.marks} Mark{question.marks !== 1 ? "s" : ""}
      </Text>
      <Text className="text-gray-900 text-base font-medium mb-5">{question.questionText}</Text>

      {question.options.map((option, index) => {
        const isSelected = selected === index;
        return (
          <Pressable
            key={index}
            onPress={() => setAnswers((prev) => ({ ...prev, [question.id]: index }))}
            className="flex-row items-center border rounded-xl px-4 py-3.5 mb-3"
            style={{ borderColor: isSelected ? "#4F39F6" : "#E5E7EB", backgroundColor: isSelected ? "#EEF0FF" : "#fff" }}
          >
            <View
              className="w-6 h-6 rounded-full items-center justify-center mr-3"
              style={{ borderWidth: 1.5, borderColor: isSelected ? "#4F39F6" : "#D1D5DB", backgroundColor: isSelected ? "#4F39F6" : "transparent" }}
            >
              {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text className={isSelected ? "text-primary font-medium flex-1" : "text-gray-700 flex-1"}>{option}</Text>
          </Pressable>
        );
      })}

      <View className="flex-1" />
      <View className="flex-row items-center justify-between py-4" style={{ gap: 10 }}>
        <Button label="Previous" variant="outline" className="flex-1" disabled={currentIndex === 0} onPress={() => setCurrentIndex((i) => i - 1)} />
        {currentIndex === questions.length - 1 ? (
          <Button label="Submit" className="flex-1" loading={submitAttempt.isPending} onPress={confirmSubmit} />
        ) : (
          <Button label="Next" className="flex-1" onPress={() => setCurrentIndex((i) => i + 1)} />
        )}
      </View>
    </Screen>
  );
}

export default LiveTestScreen;
