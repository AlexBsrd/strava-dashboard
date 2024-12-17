import {ChallengeMetric, ChallengeStatus, ChallengeType} from "./challenge-enums.model";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  startDate: Date;
  endDate: Date;
  type: ChallengeType;
  goal: number;
  metric: ChallengeMetric;
  participants: ChallengeParticipant[];
  status: ChallengeStatus;
  isPrivate: boolean;
  inviteCode?: string;
}

export interface ChallengeParticipant {
  userId: string;
  currentProgress: number;
  lastUpdate: Date;
  activities: string[]; // IDs des activités comptabilisées
}
