# 📸 Image Usage Guide for Questions

This guide explains how to add images to questions and explanations in ExamAce.

## 📁 Image Storage Location

All question and explanation images should be stored in the `public/logos/` directory.

## 🎯 Supported Image Formats

- **PNG** (recommended for diagrams, charts)
- **JPG/JPEG** (for photographs)
- **SVG** (for scalable graphics)
- **WebP** (for optimized web images)

## 📝 How to Add Images to Questions

### 1. Question Images
Add images that are part of the question itself:

```json
{
  "id": "q1",
  "questionEn": "What is shown in the diagram below?",
  "questionHi": "नीचे दिए गए चित्र में क्या दिखाया गया है?",
  "questionImage": "diagram-example.png",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 1,
  "explanation": "The diagram shows...",
  "explanationImage": "solution-diagram.png"
}
```

### 2. Explanation Images
Add images that help explain the solution:

```json
{
  "id": "q2",
  "questionEn": "Solve this math problem",
  "questionHi": "इस गणित की समस्या को हल करें",
  "questionImage": "math-problem.png",
  "options": ["10", "15", "20", "25"],
  "correct": 2,
  "explanation": "Step 1: First, we need to...",
  "explanationImage": "math-solution-steps.png"
}
```

## 🖼️ Image Naming Convention

Use descriptive, lowercase names with hyphens:

- ✅ `math-diagram.png`
- ✅ `chemistry-reaction.png`
- ✅ `physics-circuit.png`
- ✅ `geography-map.png`
- ❌ `IMG_001.jpg`
- ❌ `Question Image.png`
- ❌ `diagram123.png`

## 📏 Recommended Image Sizes

### Question Images
- **Width**: 400-800px
- **Height**: 200-400px
- **File Size**: < 500KB

### Explanation Images
- **Width**: 300-600px
- **Height**: 200-300px
- **File Size**: < 300KB

## 🎨 Image Optimization Tips

1. **Compress images** before uploading
2. **Use appropriate formats**:
   - PNG for diagrams with text
   - JPG for photographs
   - SVG for simple graphics
3. **Maintain aspect ratio**
4. **Ensure good contrast** for readability

## 📱 Responsive Design

Images will automatically:
- Scale to fit the container
- Maintain aspect ratio
- Be responsive on mobile devices
- Support zoom functionality
- Allow download

## 🔧 Features Available

### Zoom Functionality
- Click the zoom button to view images in full size
- Modal popup with larger view
- Perfect for detailed diagrams

### Download Feature
- Users can download images for offline study
- Useful for printing or saving

### Error Handling
- Graceful fallback if image is missing
- Clear error message with image path
- No broken image icons

## 📋 Example Image Files

Here are some example image names you can use:

```
public/logos/
├── math-problem.png          # Math question diagram
├── math-solution.png         # Math solution steps
├── chemistry-reaction.png    # Chemical reaction diagram
├── physics-circuit.png       # Electrical circuit diagram
├── geography-map.png         # Map for geography questions
├── biology-diagram.png       # Biology diagram
├── history-timeline.png      # Historical timeline
└── english-passage.png       # Reading comprehension passage
```

## 🚀 Quick Start

1. **Add your image** to `public/logos/`
2. **Update your JSON** with the image filename
3. **Test the question** to ensure image displays correctly
4. **Optimize if needed** for better performance

## ⚠️ Important Notes

- Images are served from the `public/logos/` directory
- Use relative paths in JSON (just the filename)
- Ensure images are accessible and properly formatted
- Test on different devices and screen sizes
- Keep file sizes reasonable for mobile users

---

**Happy Question Creating! 📚✨**
