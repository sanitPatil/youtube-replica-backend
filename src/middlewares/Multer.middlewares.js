import multer from 'multer';
import path from 'node:path';
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './public/uploads');
	},
	filename: function (req, file, cb) {
		cb(null, file.fieldname + '-' + file.originalname);
	},
});

export const upload = multer({
	storage,
	limits: {
		fileSize: 50 * 1024 * 1024,
	},
	fileFilter: (req, file, cb) => {
		const filetypes = /jpeg|jpg|png|gif|mp4|mov|avi|mkv/;
		const mimetype = filetypes.test(file.mimetype);
		const extname = filetypes.test(
			path.extname(file.originalname).toLowerCase()
		);
		if (mimetype && extname) {
			cb(null, true);
		} else {
			cb(new Error('Only image and video files are allowed!'), false);
		}
	},
});
