export const MARKDOWN_TEMPLATES = {
  // Standard Image with Caption
  IMAGE: `<Image src="url_here" alt="Image Title" caption="Enter caption here" />`,

  // Responsive Video Container
  VIDEO: `<div class="guide-video-container">
  <Video url="url_here" />
</div>`,

  // 2-Column Layout (Text Left, Image Right)
  TWO_COLUMNS: `<div class="guide-columns">
  <div>
    <h3>Column 1</h3>
    <p>Content for the left column goes here.</p>
  </div>
  <div>
    <h3>Column 2</h3>
    <p>Content for the right column goes here.</p>
  </div>
</div>`,

  // Note / Info Box
  NOTE_INFO: `<div class="guide-note">
  <strong>ℹ️ Note:</strong> Write your note content here.
</div>`,

  // Warning Box
  NOTE_WARNING: `<div class="guide-note warning">
  <strong>⚠️ Warning:</strong> Be careful with this step!
</div>`,

  // Tip Box
  NOTE_TIP: `<div class="guide-note tip">
  <strong>💡 Tip:</strong> Here is a helpful hint.
</div>`,

  // Code Block with filename/title (optional convention)
  CODE_BLOCK: `\`\`\`javascript
// Your code here
console.log("Hello Quest!");
\`\`\``
};
