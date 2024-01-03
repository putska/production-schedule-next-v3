// firebaseJobsSync.ts
import { useEffect } from "react";
import { ref, push, update, remove } from "firebase/database";
import { useList } from "react-firebase-hooks/database";
import { db } from "@/firebase";
import { useStore } from "@/store";

export const firebaseJobsSync = () => {
  const jobsRef = ref(db, "GetJobs");
  const [snapshots, loading, error] = useList(jobsRef);
  const setJobs = useStore((state) => state.setJobs);

  useEffect(() => {
    if (!loading && !error && snapshots) {
      const jobsList = snapshots.map((snapshot) => ({
        ...snapshot.val(),
        ID: snapshot.key,
      }));
      setJobs(jobsList);
    }
  }, [snapshots, loading, error, setJobs]);

  const firebaseAddJob = async (job: any) => {
    const newRef = push(jobsRef);
    await update(newRef, job);
    // useEffect will handle the store update
  };

  const firebaseUpdateJob = async (updatedJob: any) => {
    const jobRef = ref(db, `GetJobs/${updatedJob.ID}`);
    await update(jobRef, updatedJob);
    // useEffect will handle the store update
  };

  const firebaseDeleteJob = async (jobId: any) => {
    const jobRef = ref(db, `GetJobs/${jobId}`);
    await remove(jobRef);
    // useEffect will handle the store update
  };

  return { firebaseAddJob, firebaseUpdateJob, firebaseDeleteJob };
};
