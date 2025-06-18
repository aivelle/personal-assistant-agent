// src/workflow-engine.js

import voiceToAnywhere from '../workflows/scenario/automation/voice-to-anywhere.json' assert { type: 'json' };
import attachImageToAnyPost from '../workflows/scenario/automation/attach-image-to-any-post.json' assert { type: 'json' };
import contentRepurpose from '../workflows/scenario/automation/content-repurpose.json' assert { type: 'json' };
import rescheduleMeeting from '../workflows/scenario/automation/reschedule-meeting.json' assert { type: 'json' };
import dailyIntentDigest from '../workflows/scenario/automation/daily-intent-digest.json' assert { type: 'json' };

const workflows = {
  'voice_to_anywhere': voiceToAnywhere,
  'attach_image_to_any_post': attachImageToAnyPost,
  'content_repurpose': contentRepurpose,
  'reschedule_meeting': rescheduleMeeting,
  'daily_intent_digest': dailyIntentDigest
};

// Action handlers: 실제 서비스에서는 외부 API/DB 연동 등으로 확장
const actionHandlers = {
  voice_to_text: async (action, context) => {
    context.transcribed_text = await fakeVoiceToText(context.voice_data);
  },
  ask_user: async (action, context) => {
    // 실제로는 프론트/챗봇 등에서 사용자 입력을 받아야 함
    context[action.output_var] = await fakeAskUser(action.prompt);
  },
  save_to: async (action, context) => {
    await fakeSaveTo(action.destination, context[action.content_var]);
  },
  attach_image: async (action, context) => {
    await fakeAttachImage(action.post_id, context[action.image_url_var]);
  },
  ai_transform: async (action, context) => {
    context[action.output_var] = await fakeAITransform(
      context[action.content_id],
      context[action.target_format]
    );
  },
  update_meeting: async (action, context) => {
    await fakeUpdateMeeting(action.meeting_id, action.new_time);
  },
  // ...다른 액션 타입도 추가
};

/**
 * Executes the real workflow for the given intent and prompt.
 * @param {string} intent - The workflow intent
 * @param {string} prompt - The user prompt
 * @returns {Promise<object>} - Workflow execution result (placeholder)
 */
export async function runWorkflow(intent, prompt) {
  console.log(`Running real workflow for ${intent}`);
  // Real workflow execution logic (to be added later)
  return {
    message: "Real workflow logic coming soon",
    intent,
    prompt,
  };
}

/**
 * Simple workflow runner for testing/demo purposes.
 * @param {string} intent - The workflow intent
 * @param {string} prompt - The user prompt
 * @returns {Promise<object>} - Simple workflow result
 */
export async function runWorkflowSimple(intent, prompt) {
  return {
    message: "Workflow triggered (simple)",
    intent,
    prompt,
  };
}

// 실제 액션 함수 샘플 (실서비스에서는 외부 API/DB 연동)
async function fakeVoiceToText(voiceData) {
  return "This is a transcribed note.";
}
async function fakeAskUser(prompt) {
  console.log(prompt);
  return "note";
}
async function fakeSaveTo(destination, content) {
  console.log(`Saving to ${destination}: ${content}`);
}
async function fakeAttachImage(postId, imageUrl) {
  console.log(`Attaching image ${imageUrl} to post ${postId}`);
}
async function fakeAITransform(contentId, targetFormat) {
  return `Transformed content ${contentId} to format ${targetFormat}`;
}
async function fakeUpdateMeeting(meetingId, newTime) {
  console.log(`Updating meeting ${meetingId} to new time ${newTime}`);
}

export { workflows }; 