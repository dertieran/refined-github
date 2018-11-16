import select from 'select-dom';

// NOTE: Maybe usefull to add to source/libs/simplified-element-observer.js
const observeAll = (selector, listener, options = {childList: true}) => {
	const observer = new MutationObserver(listener);

	for (const el of select.all(selector)) {
		observer.observe(el, options);
	}

	// Run the first time
	listener.call(observer, []);

	return observer;
};

// TODO: Might be to hacky 🙈
// suggester.closest('textarea') didn't work 😢
const getTextarea = suggester => suggester.parentElement.previousElementSibling.previousElementSibling;

const getMention = textarea => {
	const comment = textarea.value;
	const start = comment.lastIndexOf('@', textarea.selectionStart);
	const [, mention] = comment.substring(start).match(/@(\w*)/);
	return mention;
};

const textareaListener = event => {
	const textarea = event.target;
	const mention = getMention(textarea);
	console.log('mention:', mention);
};

const mutationObserver = records => {
	const record = records[0];
	if (!record) {
		return;
	}

	const suggester = record.target;
	const textarea = getTextarea(suggester);
	if (suggester.hasAttribute('hidden')) {
		textarea.removeEventListener('keyup', textareaListener);
		return;
	}

	textarea.addEventListener('keyup', textareaListener);
};

export default function () {
	observeAll('.suggester', mutationObserver, {attributes: true, attributeFilter: ['hidden']});
}
