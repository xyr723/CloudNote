// 这个函数根据用户输入的提示词和先前已存在的笔记内容，进一步补充文本内容
export const completeTextWithLLM = async (
  existsContent: string, // 先前已存在的笔记内容
  userPrompt: string, // 用户输入的提示词
): Promise<string> => {
  const apiKey = '4312b635-7bd5-4c38-bf9f-c8b3e3a74f92';
  const apiUrl =
    process.env.OPENAI_API_URL ||
    'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
  const model = 'ep-20250228002515-z8ph5';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  const messages = [
    {role: 'system', content: 'You are a helpful assistant.'},
    {
      role: 'user',
      content: `Please help me complete the following text based on the existing content(Don't use Markdown syntex):\n\nExisting Content:\n${existsContent}\n\nUser Prompt:\n${userPrompt}`,
    },
  ];
  const body = JSON.stringify({
    model: model,
    messages,
    temperature: 0.7,
  });
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: body,
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
    const data = await response.json();
    const completion = data.choices[0].message.content;
    return completion;
  } catch (error) {
    console.error('Error completing text:', error);
    throw error;
  }
};
