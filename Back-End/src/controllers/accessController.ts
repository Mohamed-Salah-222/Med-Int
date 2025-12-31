import { Request, Response, NextFunction } from "express";
import UserProgress from "../models/UserProgress";
import Lesson from "../models/Lesson";
import Chapter from "../models/Chapter";

// Check if user can access a specific lesson
export const canAccessLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { lessonId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Admin/SuperVisor bypass
    const userRole = req.user?.role;
    if (userRole === "Admin" || userRole === "SuperVisor") {
      res.status(200).json({ canAccess: true, reason: "Admin/SuperVisor access" });
      return;
    }

    // Get lesson and chapter
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    const chapter = await Chapter.findById(lesson.chapterId);
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    // Get all lessons in this chapter, sorted by lesson number
    const allLessonsInChapter = await Lesson.find({ chapterId: chapter._id }).sort({ lessonNumber: 1 });

    // If this is the first lesson of the first chapter, always allow
    if (chapter.chapterNumber === 1 && lesson.lessonNumber === 1) {
      res.status(200).json({ canAccess: true, reason: "First lesson" });
      return;
    }

    // Get user progress
    const progress = await UserProgress.findOne({ userId });
    if (!progress) {
      res.status(403).json({
        canAccess: false,
        message: "You must start from Lesson 1",
      });
      return;
    }

    // Check if this lesson is already completed - always allow re-access
    const isCompleted = progress.completedLessons.some((cl) => cl.lessonId.toString() === lessonId && cl.passed);

    if (isCompleted) {
      res.status(200).json({ canAccess: true, reason: "Lesson already completed" });
      return;
    }

    // If this is lesson 1 in current/future chapter, check if previous chapter is done
    if (lesson.lessonNumber === 1 && chapter.chapterNumber > 1) {
      // Check if all lessons in previous chapter are completed
      const previousChapterNumber = chapter.chapterNumber - 1;
      const previousChapterLessons = await Lesson.find({
        chapterNumber: previousChapterNumber,
      });

      const allPreviousCompleted = previousChapterLessons.every((l) => progress.completedLessons.some((cl) => cl.lessonId.toString() === l._id.toString() && cl.passed));

      if (allPreviousCompleted) {
        res.status(200).json({ canAccess: true, reason: "Previous chapter completed" });
        return;
      } else {
        res.status(403).json({
          canAccess: false,
          message: "Complete all lessons in previous chapter first",
        });
        return;
      }
    }

    // For lessons 2+, check if previous lesson in same chapter is completed
    const previousLessonNumber = lesson.lessonNumber - 1;
    const previousLesson = allLessonsInChapter.find((l) => l.lessonNumber === previousLessonNumber);

    if (!previousLesson) {
      // No previous lesson found (shouldn't happen, but allow just in case)
      res.status(200).json({ canAccess: true, reason: "No previous lesson" });
      return;
    }

    const previousLessonCompleted = progress.completedLessons.some((cl) => cl.lessonId.toString() === previousLesson._id.toString() && cl.passed);

    if (previousLessonCompleted) {
      res.status(200).json({ canAccess: true, reason: "Previous lesson completed" });
      return;
    }

    // Previous lesson not completed - locked
    res.status(403).json({
      canAccess: false,
      message: `Complete Lesson ${previousLessonNumber} first`,
    });
  } catch (error) {
    next(error);
  }
};

// Check if user can access chapter test
export const canAccessChapterTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { chapterId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Admin/SuperVisor bypass
    const userRole = req.user?.role;
    if (userRole === "Admin" || userRole === "SuperVisor") {
      res.status(200).json({ canAccess: true, reason: "Admin/SuperVisor access" });
      return;
    }

    // Get chapter details
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    // Get all lessons in this chapter
    const lessonsInChapter = await Lesson.find({
      chapterId: chapterId,
    }).sort({ lessonNumber: 1 });

    const totalLessons = lessonsInChapter.length;

    // Get user progress
    const progress = await UserProgress.findOne({ userId });
    if (!progress) {
      res.status(403).json({
        canAccess: false,
        message: "Complete all chapter lessons first",
      });
      return;
    }

    // Check if user completed all lessons in this chapter
    if (progress.currentChapterNumber > chapter.chapterNumber) {
      // User is past this chapter
      res.status(200).json({ canAccess: true, reason: "Chapter completed" });
      return;
    }

    if (progress.currentChapterNumber === chapter.chapterNumber) {
      // Check if all lessons in this chapter are completed and passed
      const completedLessonsInChapter = progress.completedLessons.filter((cl) => {
        const lessonInChapter = lessonsInChapter.find((l) => l._id.toString() === cl.lessonId.toString());
        return lessonInChapter && cl.passed;
      });

      if (completedLessonsInChapter.length >= totalLessons) {
        res.status(200).json({ canAccess: true, reason: "All lessons completed" });
        return;
      }
    }

    res.status(403).json({
      canAccess: false,
      message: `Complete all ${totalLessons} lessons first`,
    });
  } catch (error) {
    next(error);
  }
};

// Check if user can access final exam
export const canAccessFinalExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Admin/SuperVisor bypass
    const userRole = req.user?.role;
    if (userRole === "Admin" || userRole === "SuperVisor") {
      res.status(200).json({ canAccess: true, reason: "Admin/SuperVisor access" });
      return;
    }

    // Get user progress
    const progress = await UserProgress.findOne({ userId });
    if (!progress) {
      res.status(403).json({
        canAccess: false,
        message: "Complete all chapters first",
      });
      return;
    }

    // Get all chapters to check if all tests are passed
    const allChapters = await Chapter.find({}).sort({ chapterNumber: 1 });
    const totalChapters = allChapters.length;

    // Check if all chapter tests are passed
    const passedChapterTests = progress.chapterTestAttempts.filter((attempt) => attempt.passed);

    if (passedChapterTests.length < totalChapters) {
      res.status(403).json({
        canAccess: false,
        message: `Pass all ${totalChapters} chapter tests first. You've passed ${passedChapterTests.length}/${totalChapters}`,
      });
      return;
    }

    res.status(200).json({ canAccess: true, reason: "All requirements met" });
  } catch (error) {
    next(error);
  }
};
