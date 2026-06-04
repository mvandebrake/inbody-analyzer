exports.handler = async (event) => {
  try {
    const { image } = JSON.parse(event.body);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [{
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: image }
          }, {
            type: 'text',
            text: 'Read the InBody scan and extract these exact numbers: Weight (lbs), Skeletal Muscle Mass (lbs), Body Fat percent, BMI, and Basal Metabolic Rate (kcal). Return ONLY the numbers in this exact format: WEIGHT: X MUSCLE: X FATPERCENT: X BMI: X BMR: X'
          }]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: data.error.message })
      };
    }

    const text = data.content[0].text;

    const weightMatch = text.match(/WEIGHT:\s*([\d.]+)/i);
    const muscleMatch = text.match(/MUSCLE:\s*([\d.]+)/i);
    const fatMatch = text.match(/FATPERCENT:\s*([\d.]+)/i);
    const bmiMatch = text.match(/BMI:\s*([\d.]+)/i);
    const bmrMatch = text.match(/BMR:\s*([\d.]+)/i);

    const metrics = {
      bodyWeight: weightMatch ? parseFloat(weightMatch[1]) : null,
      skeletal_muscle: muscleMatch ? parseFloat(muscleMatch[1]) : null,
      body_fat_percent: fatMatch ? parseFloat(fatMatch[1]) : null,
      bmi: bmiMatch ? parseFloat(bmiMatch[1]) : null,
      bmr: bmrMatch ? parseFloat(bmrMatch[1]) : null
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ metrics })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
