import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_localizations/flutter_localizations.dart' as fl;
import 'en.dart';
import 'ha.dart';
import 'yo.dart';

class AppLocalization {
  static const Locale defaultLocale = Locale('en');
  static const List<Locale> supportedLocales = [
    Locale('en'),
    Locale('ha'),
    Locale('yo'),
  ];

  static Future<Map<String, String>> load(Locale locale) async {
    final key = locale.languageCode;
    switch (key) {
      case 'ha':
        return HaLocalizations().strings;
      case 'yo':
        return YoLocalizations().strings;
      default:
        return EnLocalizations().strings;
    }
  }

  static AppLocalization of(BuildContext context) {
    return Localizations.of<AppLocalization>(context, AppLocalization)!;
  }

  String get appName => strings['app_name'] ?? 'EduPlatform';
  String get login => strings['login'] ?? 'Login';
  String get register => strings['register'] ?? 'Register';
  String get email => strings['email'] ?? 'Email';
  String get password => strings['password'] ?? 'Password';
  String get home => strings['home'] ?? 'Home';
  String get courses => strings['courses'] ?? 'Courses';
  String get exams => strings['exams'] ?? 'Exams';
  String get profile => strings['profile'] ?? 'Profile';
  String get community => strings['community'] ?? 'Community';
  String get settings => strings['settings'] ?? 'Settings';
  String get save => strings['save'] ?? 'Save';
  String get cancel => strings['cancel'] ?? 'Cancel';
  String get delete => strings['delete'] ?? 'Delete';
  String get edit => strings['edit'] ?? 'Edit';
  String get next => strings['next'] ?? 'Next';
  String get back => strings['back'] ?? 'Back';
  String get submit => strings['submit'] ?? 'Submit';
  String get confirm => strings['confirm'] ?? 'Confirm';
  String get loading => strings['loading'] ?? 'Loading...';
  String get error => strings['error'] ?? 'Error';
  String get success => strings['success'] ?? 'Success';
  String get warning => strings['warning'] ?? 'Warning';
  String get info => strings['info'] ?? 'Info';
  String get search => strings['search'] ?? 'Search';
  String get filter => strings['filter'] ?? 'Filter';
  String get sort => strings['sort'] ?? 'Sort';
  String get showMore => strings['show_more'] ?? 'Show More';
  String get showLess => strings['show_less'] ?? 'Show Less';
  String get noData => strings['no_data'] ?? 'No data available';
  String get tryAgain => strings['try_again'] ?? 'Try Again';
  String get ok => strings['ok'] ?? 'OK';
  String get yes => strings['yes'] ?? 'Yes';
  String get no => strings['no'] ?? 'No';
  String get close => strings['close'] ?? 'Close';
  String get continueText => strings['continue'] ?? 'Continue';
  String get skip => strings['skip'] ?? 'Skip';
  String get finish => strings['finish'] ?? 'Finish';
  String get start => strings['start'] ?? 'Start';
  String get stop => strings['stop'] ?? 'Stop';
  String get pause => strings['pause'] ?? 'Pause';
  String get resume => strings['resume'] ?? 'Resume';
  String get play => strings['play'] ?? 'Play';
  String get download => strings['download'] ?? 'Download';
  String get upload => strings['upload'] ?? 'Upload';
  String get share => strings['share'] ?? 'Share';
  String get print => strings['print'] ?? 'Print';
  String get refresh => strings['refresh'] ?? 'Refresh';
  String get logout => strings['logout'] ?? 'Logout';
  String get signIn => strings['sign_in'] ?? 'Sign In';
  String get signUp => strings['sign_up'] ?? 'Sign Up';
  String get forgotPassword => strings['forgot_password'] ?? 'Forgot Password?';
  String get resetPassword => strings['reset_password'] ?? 'Reset Password';
  String get changePassword => strings['change_password'] ?? 'Change Password';
  String get currentPassword => strings['current_password'] ?? 'Current Password';
  String get newPassword => strings['new_password'] ?? 'New Password';
  String get confirmPassword => strings['confirm_password'] ?? 'Confirm Password';
  String get firstName => strings['first_name'] ?? 'First Name';
  String get lastName => strings['last_name'] ?? 'Last Name';
  String get fullName => strings['full_name'] ?? 'Full Name';
  String get phoneNumber => strings['phone_number'] ?? 'Phone Number';
  String get dateOfBirth => strings['date_of_birth'] ?? 'Date of Birth';
  String get gender => strings['gender'] ?? 'Gender';
  String get male => strings['male'] ?? 'Male';
  String get female => strings['female'] ?? 'Female';
  String get other => strings['other'] ?? 'Other';
  String get student => strings['student'] ?? 'Student';
  String get parent => strings['parent'] ?? 'Parent';
  String get teacher => strings['teacher'] ?? 'Teacher';
  String get school => strings['school'] ?? 'School';
  String get course => strings['course'] ?? 'Course';
  String get lesson => strings['lesson'] ?? 'Lesson';
  String get exam => strings['exam'] ?? 'Exam';
  String get quiz => strings['quiz'] ?? 'Quiz';
  String get assignment => strings['assignment'] ?? 'Assignment';
  String get subject => strings['subject'] ?? 'Subject';
  String get topic => strings['topic'] ?? 'Topic';
  String get progress => strings['progress'] ?? 'Progress';
  String get results => strings['results'] ?? 'Results';
  String get score => strings['score'] ?? 'Score';
  String get grade => strings['grade'] ?? 'Grade';
  String get certificate => strings['certificate'] ?? 'Certificate';
  String get notification => strings['notification'] ?? 'Notification';
  String get notifications => strings['notifications'] ?? 'Notifications';
  String get message => strings['message'] ?? 'Message';
  String get messages => strings['messages'] ?? 'Messages';
  String get settingsTitle => strings['settings_title'] ?? 'Settings';
  String get about => strings['about'] ?? 'About';
  String get help => strings['help'] ?? 'Help';
  String get privacyPolicy => strings['privacy_policy'] ?? 'Privacy Policy';
  String get termsOfService => strings['terms_of_service'] ?? 'Terms of Service';
  String get rateUs => strings['rate_us'] ?? 'Rate Us';
  String get shareApp => strings['share_app'] ?? 'Share App';
  String get language => strings['language'] ?? 'Language';
  String get theme => strings['theme'] ?? 'Theme';
  String get light => strings['light'] ?? 'Light';
  String get dark => strings['dark'] ?? 'Dark';
  String get system => strings['system'] ?? 'System';
  String get notificationsTitle => strings['notifications_title'] ?? 'Notifications';
  String get enabled => strings['enabled'] ?? 'Enabled';
  String get disabled => strings['disabled'] ?? 'Disabled';
  String get on => strings['on'] ?? 'On';
  String get off => strings['off'] ?? 'Off';
  String get all => strings['all'] ?? 'All';
  String get read => strings['read'] ?? 'Read';
  String get unread => strings['unread'] ?? 'Unread';
  String get markAsRead => strings['mark_as_read'] ?? 'Mark as Read';
  String get markAsUnread => strings['mark_as_unread'] ?? 'Mark as Unread';
  String get deleteNotification => strings['delete_notification'] ?? 'Delete Notification';
  String get clearAll => strings['clear_all'] ?? 'Clear All';
  String get noNotifications => strings['no_notifications'] ?? 'No notifications yet';
  String get yourProgress => strings['your_progress'] ?? 'Your Progress';
  String get averageScore => strings['average_score'] ?? 'Average Score';
  String get studyTime => strings['study_time'] ?? 'Study Time';
  String get lessonsCompleted => strings['lessons_completed'] ?? 'Lessons Completed';
  String get examsTaken => strings['exams_taken'] ?? 'Exams Taken';
  String get streak => strings['streak'] ?? 'Streak';
  String get days => strings['days'] ?? 'Days';
  String get weakAreas => strings['weak_areas'] ?? 'Weak Areas';
  String get strongAreas => strings['strong_areas'] ?? 'Strong Areas';
  String get recommendations => strings['recommendations'] ?? 'Recommendations';
  String get studyNow => strings['study_now'] ?? 'Study Now';
  String get continueLearning => strings['continue_learning'] ?? 'Continue Learning';
  String get startExam => strings['start_exam'] ?? 'Start Exam';
  String get viewResults => strings['view_results'] ?? 'View Results';
  String get retakeExam => strings['retake_exam'] ?? 'Retake Exam';
  String get pass => strings['pass'] ?? 'Pass';
  String get fail => strings['fail'] ?? 'Fail';
  String get pending => strings['pending'] ?? 'Pending';
  String get inProgress => strings['in_progress'] ?? 'In Progress';
  String get completed => strings['completed'] ?? 'Completed';
  String get notStarted => strings['not_started'] ?? 'Not Started';
  String get submitted => strings['submitted'] ?? 'Submitted';
  String get graded => strings['graded'] ?? 'Graded';
  String get due => strings['due'] ?? 'Due';
  String get overdue => strings['overdue'] ?? 'Overdue';
  String get timeRemaining => strings['time_remaining'] ?? 'Time Remaining';
  String get timeUp => strings['time_up'] ?? 'Time\'s Up!';
  String get question => strings['question'] ?? 'Question';
  String get questions => strings['questions'] ?? 'Questions';
  String get of => strings['of'] ?? 'of';
  String get previous => strings['previous'] ?? 'Previous';
  String get nextQuestion => strings['next_question'] ?? 'Next';
  String get submitExam => strings['submit_exam'] ?? 'Submit Exam';
  String get confirmSubmit => strings['confirm_submit'] ?? 'Are you sure you want to submit?';
  String get noResults => strings['no_results'] ?? 'No results found';
  String get searchResults => strings['search_results'] ?? 'Search Results';
  String get noCourses => strings['no_courses'] ?? 'No courses available';
  String get noLessons => strings['no_lessons'] ?? 'No lessons available';
  String get noExams => strings['no_exams'] ?? 'No exams available';
  String get noAssignments => strings['no_assignments'] ?? 'No assignments available';
  String get noNotificationsHome => strings['no_notifications_home'] ?? 'No notifications';
  String get networkError => strings['network_error'] ?? 'Network error. Please check your connection.';
  String get serverError => strings['server_error'] ?? 'Server error. Please try again later.';
  String get authenticationError => strings['authentication_error'] ?? 'Authentication failed. Please login again.';
  String get sessionExpired => strings['session_expired'] ?? 'Session expired. Please login again.';
  String get somethingWentWrong => strings['something_went_wrong'] ?? 'Something went wrong. Please try again.';
  String get pleaseWait => strings['please_wait'] ?? 'Please wait...';
  String get processYourRequest => strings['process_your_request'] ?? 'Processing your request...';
  String get uploadSuccess => strings['upload_success'] ?? 'Upload successful';
  String get uploadFailed => strings['upload_failed'] ?? 'Upload failed. Please try again.';
  String get downloadSuccess => strings['download_success'] ?? 'Download successful';
  String get downloadFailed => strings['download_failed'] ?? 'Download failed. Please try again.';
  String get deleted => strings['deleted'] ?? 'Deleted successfully';
  String get deletedFailed => strings['deleted_failed'] ?? 'Delete failed. Please try again.';
  String get updated => strings['updated'] ?? 'Updated successfully';
  String get updatedFailed => strings['updated_failed'] ?? 'Update failed. Please try again.';
  String get created => strings['created'] ?? 'Created successfully';
  String get createdFailed => strings['created_failed'] ?? 'Create failed. Please try again.';
  String get invalidInput => strings['invalid_input'] ?? 'Invalid input. Please check your entries.';
  String get emailRequired => strings['email_required'] ?? 'Email is required';
  String get invalidEmail => strings['invalid_email'] ?? 'Please enter a valid email';
  String get passwordRequired => strings['password_required'] ?? 'Password is required';
  String get passwordMinLength => strings['password_min_length'] ?? 'Password must be at least 8 characters';
  String get passwordsNotMatch => strings['passwords_not_match'] ?? 'Passwords do not match';
  String get nameRequired => strings['name_required'] ?? 'Name is required';
  String get nameMinLength => strings['name_min_length'] ?? 'Name must be at least 2 characters';
  String get phoneRequired => strings['phone_required'] ?? 'Phone number is required';
  String get otpSent => strings['otp_sent'] ?? 'OTP sent to your email';
  String get otpVerified => strings['otp_verified'] ?? 'OTP verified successfully';
  String get otpInvalid => strings['otp_invalid'] ?? 'Invalid OTP. Please try again.';
  String get verifyEmailTitle => strings['verify_email_title'] ?? 'Verify Your Email';
  String get verifyEmailMessage => strings['verify_email_message'] ?? 'We sent a verification link to your email. Please check your inbox.';
  String get resendOtp => strings['resend_otp'] ?? 'Resend OTP';
  String get otpSentAgain => strings['otp_sent_again'] ?? 'OTP resent successfully';
  String get enterOtp => strings['enter_otp'] ?? 'Enter OTP';
  String get otpPlaceholder => strings['otp_placeholder'] ?? 'Enter 6-digit OTP';
  String get selectRole => strings['select_role'] ?? 'Select your role';
  String get roleStudent => strings['role_student'] ?? 'Student';
  String get roleParent => strings['role_parent'] ?? 'Parent';
  String get roleTeacher => strings['role_teacher'] ?? 'Teacher';
  String get welcomeBack => strings['welcome_back'] ?? 'Welcome Back';
  String get welcome => strings['welcome'] ?? 'Welcome';
  String get getStarted => strings['get_started'] ?? 'Get Started';
  String get explore => strings['explore'] ?? 'Explore';
  String get learn => strings['learn'] ?? 'Learn';
  String get achieve => strings['achieve'] ?? 'Achieve';
  String get aiTutor => strings['ai_tutor'] ?? 'AI Tutor';
  String get flashcards => strings['flashcards'] ?? 'Flashcards';
  String get library => strings['library'] ?? 'Library';
  String get gamification => strings['gamification'] ?? 'Gamification';
  String get xp => strings['xp'] ?? 'XP';
  String get points => strings['points'] ?? 'Points';
  String get badges => strings['badges'] ?? 'Badges';
  String get achievements => strings['achievements'] ?? 'Achievements';
  String get leaderboard => strings['leaderboard'] ?? 'Leaderboard';
  String get level => strings['level'] ?? 'Level';
  String get subscription => strings['subscription'] ?? 'Subscription';
  String get subscriptions => strings['subscriptions'] ?? 'Subscriptions';
  String get plans => strings['plans'] ?? 'Plans';
  String get free => strings['free'] ?? 'Free';
  String get premium => strings['premium'] ?? 'Premium';
  String get basic => strings['basic'] ?? 'Basic';
  String get student => strings['student'] ?? 'Student';
  String get parentPlan => strings['parent_plan'] ?? 'Parent';
  String get teacherPlan => strings['teacher_plan'] ?? 'Teacher';
  String get schoolPlan => strings['school_plan'] ?? 'School';
  String get enterprisePlan => strings['enterprise_plan'] ?? 'Enterprise';
  String get subscribe => strings['subscribe'] ?? 'Subscribe';
  String get subscribed => strings['subscribed'] ?? 'Subscribed';
  String get manageSubscription => strings['manage_subscription'] ?? 'Manage Subscription';
  String get cancelSubscription => strings['cancel_subscription'] ?? 'Cancel Subscription';
  String get currentPlan => strings['current_plan'] ?? 'Current Plan';
  String get expires => strings['expires'] ?? 'Expires';
  String get renewalDate => strings['renewal_date'] ?? 'Renewal Date';
  String get paymentSuccess => strings['payment_success'] ?? 'Payment successful';
  String get paymentFailed => strings['payment_failed'] ?? 'Payment failed. Please try again.';
  String get paymentPending => strings['payment_pending'] ?? 'Payment pending';
  String get paymentHistory => strings['payment_history'] ?? 'Payment History';
  String get invoice => strings['invoice'] ?? 'Invoice';
  String get downloadInvoice => strings['download_invoice'] ?? 'Download Invoice';
  String get communityTitle => strings['community_title'] ?? 'Community';
  String get forums => strings['forums'] ?? 'Forums';
  String get studyGroups => strings['study_groups'] ?? 'Study Groups';
  String get askQuestion => strings['ask_question'] ?? 'Ask a Question';
  String get post => strings['post'] ?? 'Post';
  String get posts => strings['posts'] ?? 'Posts';
  String get comments => strings['comments'] ?? 'Comments';
  String get like => strings['like'] ?? 'Like';
  String get liked => strings['liked'] ?? 'Liked';
  String get reply => strings['reply'] ?? 'Reply';
  String get writeComment => strings['write_comment'] ?? 'Write a comment...';
  String get send => strings['send'] ?? 'Send';
  String get group => strings['group'] ?? 'Group';
  String get groups => strings['groups'] ?? 'Groups';
  String get joinGroup => strings['join_group'] ?? 'Join Group';
  String get leaveGroup => strings['leave_group'] ?? 'Leave Group';
  String get member => strings['member'] ?? 'Member';
  String get members => strings['members'] ?? 'Members';
  String get createGroup => strings['create_group'] ?? 'Create Group';
  String get groupName => strings['group_name'] ?? 'Group Name';
  String get groupDescription => strings['group_description'] ?? 'Group Description';
  String get parentDashboard => strings['parent_dashboard'] ?? 'Parent Dashboard';
  String get children => strings['children'] ?? 'Children';
  String get addChild => strings['add_child'] ?? 'Add Child';
  String get removeChild => strings['remove_child'] ?? 'Remove Child';
  String get childName => strings['child_name'] ?? 'Child Name';
  String get childProgress => strings['child_progress'] ?? 'Child Progress';
  String get childPerformance => strings['child_performance'] ?? 'Child Performance';
  String get childStudyTime => strings['child_study_time'] ?? 'Child Study Time';
  String get childResults => strings['child_results'] ?? 'Child Results';
  String get childCourses => strings['child_courses'] ?? 'Child Courses';
  String get weakSubjects => strings['weak_subjects'] ?? 'Weak Subjects';
  String get strongSubjects => strings['strong_subjects'] ?? 'Strong Subjects';
  String get teacherDashboard => strings['teacher_dashboard'] ?? 'Teacher Dashboard';
  String get myCourses => strings['my_courses'] ?? 'My Courses';
  String get myStudents => strings['my_students'] ?? 'My Students';
  String get myAssignments => strings['my_assignments'] ?? 'My Assignments';
  String get myExams => strings['my_exams'] ?? 'My Exams';
  String get createCourse => strings['create_course'] ?? 'Create Course';
  String get createLesson => strings['create_lesson'] ?? 'Create Lesson';
  String get createAssignment => strings['create_assignment'] ?? 'Create Assignment';
  String get createExam => strings['create_exam'] ?? 'Create Exam';
  String get courseTitle => strings['course_title'] ?? 'Course Title';
  String get courseDescription => strings['course_description'] ?? 'Course Description';
  String get courseDuration => strings['course_duration'] ?? 'Course Duration';
  String get coursePrice => strings['course_price'] ?? 'Course Price';
  String get courseLevel => strings['course_level'] ?? 'Course Level';
  String get lessonTitle => strings['lesson_title'] ?? 'Lesson Title';
  String get lessonContent => strings['lesson_content'] ?? 'Lesson Content';
  String get lessonVideo => strings['lesson_video'] ?? 'Lesson Video';
  String get lessonNotes => strings['lesson_notes'] ?? 'Lesson Notes';
  String get lessonResources => strings['lesson_resources'] ?? 'Lesson Resources';
  String get addResource => strings['add_resource'] ?? 'Add Resource';
  String get removeResource => strings['remove_resource'] ?? 'Remove Resource';
  String get resourceType => strings['resource_type'] ?? 'Resource Type';
  String get video => strings['video'] ?? 'Video';
  String get pdf => strings['pdf'] ?? 'PDF';
  String get image => strings['image'] ?? 'Image';
  String get document => strings['document'] ?? 'Document';
  String get note => strings['note'] ?? 'Note';
  String get assignmentTitle => strings['assignment_title'] ?? 'Assignment Title';
  String get assignmentDescription => strings['assignment_description'] ?? 'Assignment Description';
  String get assignmentDueDate => strings['assignment_due_date'] ?? 'Assignment Due Date';
  String get assignmentPoints => strings['assignment_points'] ?? 'Assignment Points';
  String get submission => strings['submission'] ?? 'Submission';
  String get submissions => strings['submissions'] ?? 'Submissions';
  String get submitAssignment => strings['submit_assignment'] ?? 'Submit Assignment';
  String get uploadFile => strings['upload_file'] ?? 'Upload File';
  String get grade => strings['grade'] ?? 'Grade';
  String get feedback => strings['feedback'] ?? 'Feedback';
  String get examTitle => strings['exam_title'] ?? 'Exam Title';
  String get examDuration => strings['exam_duration'] ?? 'Exam Duration';
  String get examPassMark => strings['exam_pass_mark'] ?? 'Exam Pass Mark';
  String get examQuestions => strings['exam_questions'] ?? 'Exam Questions';
  String get addQuestion => strings['add_question'] ?? 'Add Question';
  String get editQuestion => strings['edit_question'] ?? 'Edit Question';
  String get deleteQuestion => strings['delete_question'] ?? 'Delete Question';
  String get questionText => strings['question_text'] ?? 'Question Text';
  String get questionType => strings['question_type'] ?? 'Question Type';
  String get option => strings['option'] ?? 'Option';
  String get options => strings['options'] ?? 'Options';
  String get correctAnswer => strings['correct_answer'] ?? 'Correct Answer';
  String get explanation => strings['explanation'] ?? 'Explanation';
  String get difficulty => strings['difficulty'] ?? 'Difficulty';
  String get easy => strings['easy'] ?? 'Easy';
  String get medium => strings['medium'] ?? 'Medium';
  String get hard => strings['hard'] ?? 'Hard';
  String get mcq => strings['mcq'] ?? 'MCQ';
  String get trueFalse => strings['true_false'] ?? 'True/False';
  String get fillBlank => strings['fill_blank'] ?? 'Fill in the Blank';
  String get shortAnswer => strings['short_answer'] ?? 'Short Answer';
  String get essay => strings['essay'] ?? 'Essay';
  String get numerical => strings['numerical'] ?? 'Numerical';
  String get pastQuestions => strings['past_questions'] ?? 'Past Questions';
  String get jamb => strings['jamb'] ?? 'JAMB';
  String get waec => strings['waec'] ?? 'WAEC';
  String get neco => strings['neco'] ?? 'NECO';
  String get nabteb => strings['nabteb'] ?? 'NABTEB';
  String get board => strings['board'] ?? 'Board';
  String get year => strings['year'] ?? 'Year';
  String get subject => strings['subject'] ?? 'Subject';
  String get topic => strings['topic'] ?? 'Topic';
  String get selectSubject => strings['select_subject'] ?? 'Select Subject';
  String get selectTopic => strings['select_topic'] ?? 'Select Topic';
  String get selectYear => strings['select_year'] ?? 'Select Year';
  String get allSubjects => strings['all_subjects'] ?? 'All Subjects';
  String get allTopics => strings['all_topics'] ?? 'All Topics';
  String get allYears => strings['all_years'] ?? 'All Years';
  String get practice => strings['practice'] ?? 'Practice';
  String get timed => strings['timed'] ?? 'Timed';
  String get mock => strings['mock'] ?? 'Mock';
  String get full => strings['full'] ?? 'Full';
  String get aiExplanation => strings['ai_explanation'] ?? 'AI Explanation';
  String get explainLikeImFive => strings['explain_like_im_five'] ?? 'Explain Like I\'m 5';
  String get explainLikeImTen => strings['explain_like_im_ten'] ?? 'Explain Like I\'m 10';
  String get aiQuiz => strings['ai_quiz'] ?? 'AI Quiz';
  String get generateQuiz => strings['generate_quiz'] ?? 'Generate Quiz';
  String get quizQuestions => strings['quiz_questions'] ?? 'Quiz Questions';
  String get quizDuration => strings['quiz_duration'] ?? 'Quiz Duration';
  String get quizDifficulty => strings['quiz_difficulty'] ?? 'Quiz Difficulty';
  String get flashcard => strings['flashcard'] ?? 'Flashcard';
  String get flashcardsTitle => strings['flashcards_title'] ?? 'Flashcards';
  String get myFlashcards => strings['my_flashcards'] ?? 'My Flashcards';
  String get courseFlashcards => strings['course_flashcards'] ?? 'Course Flashcards';
  String get aiGenerated => strings['ai_generated'] ?? 'AI Generated';
  String get revise => strings['revise'] ?? 'Revise';
  String get knowIt => strings['know_it'] ?? 'Know It';
  String get gettingThere => strings['getting_there'] ?? 'Getting There';
  String get stillLearning => strings['still_learning'] ?? 'Still Learning';
  String get spacedRepetition => strings['spaced_repetition'] ?? 'Spaced Repetition';
  String get nextReview => strings['next_review'] ?? 'Next Review';
  String get reviewDue => strings['review_due'] ?? 'Review Due';
  String get libraryTitle => strings['library_title'] ?? 'Library';
  String get textbooks => strings['textbooks'] ?? 'Textbooks';
  String get studyNotes => strings['study_notes'] ?? 'Study Notes';
  String get researchMaterials => strings['research_materials'] ?? 'Research Materials';
  String get handouts => strings['handouts'] ?? 'Handouts';
  String get lectureNotes => strings['lecture_notes'] ?? 'Lecture Notes';
  String get articles => strings['articles'] ?? 'Articles';
  String get educationalVideos => strings['educational_videos'] ?? 'Educational Videos';
  String get filterBy => strings['filter_by'] ?? 'Filter by';
  String get level => strings['level'] ?? 'Level';
  String get allLevels => strings['all_levels'] ?? 'All Levels';
  String get earlyYears => strings['early_years'] ?? 'Early Years';
  String get primary => strings['primary'] ?? 'Primary';
  String get jss => strings['jss'] ?? 'JSS';
  String get ss => strings['ss'] ?? 'SS';
  String get tertiary => strings['tertiary'] ?? 'Tertiary';
  String get professional => strings['professional'] ?? 'Professional';
  String get adult => strings['adult'] ?? 'Adult';
  String get vocational => strings['vocational'] ?? 'Vocational';
  String get p1 => strings['p1'] ?? 'Primary 1';
  String get p2 => strings['p2'] ?? 'Primary 2';
  String get p3 => strings['p3'] ?? 'Primary 3';
  String get p4 => strings['p4'] ?? 'Primary 4';
  String get p5 => strings['p5'] ?? 'Primary 5';
  String get p6 => strings['p6'] ?? 'Primary 6';
  String get jss1 => strings['jss1'] ?? 'JSS 1';
  String get jss2 => strings['jss2'] ?? 'JSS 2';
  String get jss3 => strings['jss3'] ?? 'JSS 3';
  String get ss1 => strings['ss1'] ?? 'SS 1';
  String get ss2 => strings['ss2'] ?? 'SS 2';
  String get ss3 => strings['ss3'] ?? 'SS 3';
  String get university => strings['university'] ?? 'University';
  String get polytechnic => strings['polytechnic'] ?? 'Polytechnic';
  String get collegeOfEducation => strings['college_of_education'] ?? 'College of Education';
  String get certification => strings['certification'] ?? 'Certification';
  String get careerTraining => strings['career_training'] ?? 'Career Training';
  String get settingsProfile => strings['settings_profile'] ?? 'Profile Settings';
  String get settingsSecurity => strings['settings_security'] ?? 'Security';
  String get settingsNotifications => strings['settings_notifications'] ?? 'Notification Settings';
  String get settingsPrivacy => strings['settings_privacy'] ?? 'Privacy';
  String get settingsAbout => strings['settings_about'] ?? 'About';
  String get editProfile => strings['edit_profile'] ?? 'Edit Profile';
  String get updateProfile => strings['update_profile'] ?? 'Update Profile';
  String get avatar => strings['avatar'] ?? 'Avatar';
  String get changeAvatar => strings['change_avatar'] ?? 'Change Avatar';
  String get bio => strings['bio'] ?? 'Bio';
  String get bioPlaceholder => strings['bio_placeholder'] ?? 'Tell us about yourself...';
  String get saveChanges => strings['save_changes'] ?? 'Save Changes';
  String get cancelChanges => strings['cancel_changes'] ?? 'Cancel Changes';
  String get logoutConfirm => strings['logout_confirm'] ?? 'Are you sure you want to logout?';
  String get deleteAccount => strings['delete_account'] ?? 'Delete Account';
  String get deleteAccountConfirm => strings['delete_account_confirm'] ?? 'Are you sure you want to delete your account? This action cannot be undone.';
  String get darkMode => strings['dark_mode'] ?? 'Dark Mode';
  String get notificationsOn => strings['notifications_on'] ?? 'Notifications On';
  String get notificationsOff => strings['notifications_off'] ?? 'Notifications Off';
  String get sound => strings['sound'] ?? 'Sound';
  String get vibrate => strings['vibrate'] ?? 'Vibrate';
  String get appVersion => strings['app_version'] ?? 'App Version';
  String get version => strings['version'] ?? 'Version';
  String get builtWith => strings['built_with'] ?? 'Built with Flutter';
  String get copyright => strings['copyright'] ?? 'Copyright';
  String get allRightsReserved => strings['all_rights_reserved'] ?? 'All rights reserved';
  String get learnMore => strings['learn_more'] ?? 'Learn More';
  String get backToHome => strings['back_to_home'] ?? 'Back to Home';
  String get goBack => strings['go_back'] ?? 'Go Back';
  String get viewAll => strings['view_all'] ?? 'View All';
  String get seeMore => strings['see_more'] ?? 'See More';
  String get seeLess => strings['see_less'] ?? 'See Less';
  String get noInternet => strings['no_internet'] ?? 'No Internet Connection';
  String get checkConnection => strings['check_connection'] ?? 'Please check your internet connection and try again.';
  String get retry => strings['retry'] ?? 'Retry';
  String get loadingData => strings['loading_data'] ?? 'Loading data...';
  String get noDataAvailable => strings['no_data_available'] ?? 'No data available';
  String get noDataFound => strings['no_data_found'] ?? 'No data found';
  String get noResultsFound => strings['no_results_found'] ?? 'No results found';
  String get emptyState => strings['empty_state'] ?? 'Nothing here yet';
  String get emptyStateMessage => strings['empty_state_message'] ?? 'Check back later or try a different search.';
  String get errorState => strings['error_state'] ?? 'Something went wrong';
  String get errorStateMessage => strings['error_state_message'] ?? 'Please try again later.';
  String get offline => strings['offline'] ?? 'Offline';
  String get offlineMessage => strings['offline_message'] ?? 'You are currently offline. Some features may not be available.';
  String get comingSoon => strings['coming_soon'] ?? 'Coming Soon';
  String get comingSoonMessage => strings['coming_soon_message'] ?? 'This feature is under development. Stay tuned!';
}

abstract class AppLocalizationDelegate extends LocalizationsDelegate<AppLocalization> {
  const AppLocalizationDelegate();
}

class EnLocalizations {
  Map<String, String> get strings => const {
    'app_name': 'EduPlatform',
    'login': 'Login',
    'register': 'Register',
    'email': 'Email',
    'password': 'Password',
    'home': 'Home',
    'courses': 'Courses',
    'exams': 'Exams',
    'profile': 'Profile',
    'community': 'Community',
    'settings': 'Settings',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'next': 'Next',
    'back': 'Back',
    'submit': 'Submit',
    'confirm': 'Confirm',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'search': 'Search',
    'filter': 'Filter',
    'sort': 'Sort',
    'show_more': 'Show More',
    'show_less': 'Show Less',
    'no_data': 'No data available',
    'try_again': 'Try Again',
    'ok': 'OK',
    'yes': 'Yes',
    'no': 'No',
    'close': 'Close',
    'continue': 'Continue',
    'skip': 'Skip',
    'finish': 'Finish',
    'start': 'Start',
    'play': 'Play',
    'download': 'Download',
    'upload': 'Upload',
    'share': 'Share',
    'refresh': 'Refresh',
    'logout': 'Logout',
    'sign_in': 'Sign In',
    'sign_up': 'Sign Up',
    'forgot_password': 'Forgot Password?',
    'reset_password': 'Reset Password',
    'change_password': 'Change Password',
    'current_password': 'Current Password',
    'new_password': 'New Password',
    'confirm_password': 'Confirm Password',
    'first_name': 'First Name',
    'last_name': 'Last Name',
    'full_name': 'Full Name',
    'phone_number': 'Phone Number',
    'date_of_birth': 'Date of Birth',
    'gender': 'Gender',
    'male': 'Male',
    'female': 'Female',
    'other': 'Other',
    'student': 'Student',
    'parent': 'Parent',
    'teacher': 'Teacher',
    'school': 'School',
    'course': 'Course',
    'lesson': 'Lesson',
    'exam': 'Exam',
    'quiz': 'Quiz',
    'assignment': 'Assignment',
    'subject': 'Subject',
    'topic': 'Topic',
    'progress': 'Progress',
    'results': 'Results',
    'score': 'Score',
    'grade': 'Grade',
    'certificate': 'Certificate',
    'notification': 'Notification',
    'notifications': 'Notifications',
    'message': 'Message',
    'messages': 'Messages',
    'settings_title': 'Settings',
    'about': 'About',
    'help': 'Help',
    'privacy_policy': 'Privacy Policy',
    'terms_of_service': 'Terms of Service',
    'rate_us': 'Rate Us',
    'share_app': 'Share App',
    'language': 'Language',
    'theme': 'Theme',
    'light': 'Light',
    'dark': 'Dark',
    'system': 'System',
    'notifications_title': 'Notifications',
    'enabled': 'Enabled',
    'disabled': 'Disabled',
    'on': 'On',
    'off': 'Off',
    'all': 'All',
    'read': 'Read',
    'unread': 'Unread',
    'mark_as_read': 'Mark as Read',
    'mark_as_unread': 'Mark as Unread',
    'delete_notification': 'Delete Notification',
    'clear_all': 'Clear All',
    'no_notifications': 'No notifications yet',
    'your_progress': 'Your Progress',
    'average_score': 'Average Score',
    'study_time': 'Study Time',
    'lessons_completed': 'Lessons Completed',
    'exams_taken': 'Exams Taken',
    'streak': 'Streak',
    'days': 'Days',
    'weak_areas': 'Weak Areas',
    'strong_areas': 'Strong Areas',
    'recommendations': 'Recommendations',
    'study_now': 'Study Now',
    'continue_learning': 'Continue Learning',
    'start_exam': 'Start Exam',
    'view_results': 'View Results',
    'retake_exam': 'Retake Exam',
    'pass': 'Pass',
    'fail': 'Fail',
    'pending': 'Pending',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'not_started': 'Not Started',
    'submitted': 'Submitted',
    'graded': 'Graded',
    'due': 'Due',
    'overdue': 'Overdue',
    'time_remaining': 'Time Remaining',
    'time_up': 'Time\'s Up!',
    'question': 'Question',
    'questions': 'Questions',
    'of': 'of',
    'previous': 'Previous',
    'next_question': 'Next',
    'submit_exam': 'Submit Exam',
    'confirm_submit': 'Are you sure you want to submit?',
    'no_results': 'No results found',
    'search_results': 'Search Results',
    'no_courses': 'No courses available',
    'no_lessons': 'No lessons available',
    'no_exams': 'No exams available',
    'no_assignments': 'No assignments available',
    'no_notifications_home': 'No notifications',
    'network_error': 'Network error. Please check your connection.',
    'server_error': 'Server error. Please try again later.',
    'authentication_error': 'Authentication failed. Please login again.',
    'session_expired': 'Session expired. Please login again.',
    'something_went_wrong': 'Something went wrong. Please try again.',
    'please_wait': 'Please wait...',
    'process_your_request': 'Processing your request...',
    'upload_success': 'Upload successful',
    'upload_failed': 'Upload failed. Please try again.',
    'download_success': 'Download successful',
    'download_failed': 'Download failed. Please try again.',
    'deleted': 'Deleted successfully',
    'deleted_failed': 'Delete failed. Please try again.',
    'updated': 'Updated successfully',
    'updated_failed': 'Update failed. Please try again.',
    'created': 'Created successfully',
    'created_failed': 'Create failed. Please try again.',
    'invalid_input': 'Invalid input. Please check your entries.',
    'email_required': 'Email is required',
    'invalid_email': 'Please enter a valid email',
    'password_required': 'Password is required',
    'password_min_length': 'Password must be at least 8 characters',
    'passwords_not_match': 'Passwords do not match',
    'name_required': 'Name is required',
    'name_min_length': 'Name must be at least 2 characters',
    'phone_required': 'Phone number is required',
    'otp_sent': 'OTP sent to your email',
    'otp_verified': 'OTP verified successfully',
    'otp_invalid': 'Invalid OTP. Please try again.',
    'verify_email_title': 'Verify Your Email',
    'verify_email_message': 'We sent a verification link to your email. Please check your inbox.',
    'resend_otp': 'Resend OTP',
    'otp_sent_again': 'OTP resent successfully',
    'enter_otp': 'Enter OTP',
    'otp_placeholder': 'Enter 6-digit OTP',
    'select_role': 'Select your role',
    'role_student': 'Student',
    'role_parent': 'Parent',
    'role_teacher': 'Teacher',
    'welcome_back': 'Welcome Back',
    'welcome': 'Welcome',
    'get_started': 'Get Started',
    'explore': 'Explore',
    'learn': 'Learn',
    'achieve': 'Achieve',
    'ai_tutor': 'AI Tutor',
    'flashcards': 'Flashcards',
    'library': 'Library',
    'gamification': 'Gamification',
    'xp': 'XP',
    'points': 'Points',
    'badges': 'Badges',
    'achievements': 'Achievements',
    'leaderboard': 'Leaderboard',
    'level': 'Level',
    'subscription': 'Subscription',
    'subscriptions': 'Subscriptions',
    'plans': 'Plans',
    'free': 'Free',
    'premium': 'Premium',
    'basic': 'Basic',
    'subscribe': 'Subscribe',
    'subscribed': 'Subscribed',
    'manage_subscription': 'Manage Subscription',
    'cancel_subscription': 'Cancel Subscription',
    'current_plan': 'Current Plan',
    'expires': 'Expires',
    'renewal_date': 'Renewal Date',
    'payment_success': 'Payment successful',
    'payment_failed': 'Payment failed. Please try again.',
    'payment_pending': 'Payment pending',
    'payment_history': 'Payment History',
    'invoice': 'Invoice',
    'download_invoice': 'Download Invoice',
    'community_title': 'Community',
    'forums': 'Forums',
    'study_groups': 'Study Groups',
    'ask_question': 'Ask a Question',
    'post': 'Post',
    'posts': 'Posts',
    'comments': 'Comments',
    'like': 'Like',
    'liked': 'Liked',
    'reply': 'Reply',
    'write_comment': 'Write a comment...',
    'send': 'Send',
    'group': 'Group',
    'groups': 'Groups',
    'join_group': 'Join Group',
    'leave_group': 'Leave Group',
    'member': 'Member',
    'members': 'Members',
    'create_group': 'Create Group',
    'group_name': 'Group Name',
    'group_description': 'Group Description',
    'parent_dashboard': 'Parent Dashboard',
    'children': 'Children',
    'add_child': 'Add Child',
    'remove_child': 'Remove Child',
    'child_name': 'Child Name',
    'child_progress': 'Child Progress',
    'child_performance': 'Child Performance',
    'child_study_time': 'Child Study Time',
    'child_results': 'Child Results',
    'child_courses': 'Child Courses',
    'weak_subjects': 'Weak Subjects',
    'strong_subjects': 'Strong Subjects',
    'teacher_dashboard': 'Teacher Dashboard',
    'my_courses': 'My Courses',
    'my_students': 'My Students',
    'my_assignments': 'My Assignments',
    'my_exams': 'My Exams',
    'create_course': 'Create Course',
    'create_lesson': 'Create Lesson',
    'create_assignment': 'Create Assignment',
    'create_exam': 'Create Exam',
    'course_title': 'Course Title',
    'course_description': 'Course Description',
    'course_duration': 'Course Duration',
    'course_price': 'Course Price',
    'course_level': 'Course Level',
    'lesson_title': 'Lesson Title',
    'lesson_content': 'Lesson Content',
    'lesson_video': 'Lesson Video',
    'lesson_notes': 'Lesson Notes',
    'lesson_resources': 'Lesson Resources',
    'add_resource': 'Add Resource',
    'remove_resource': 'Remove Resource',
    'resource_type': 'Resource Type',
    'video': 'Video',
    'pdf': 'PDF',
    'image': 'Image',
    'document': 'Document',
    'note': 'Note',
    'assignment_title': 'Assignment Title',
    'assignment_description': 'Assignment Description',
    'assignment_due_date': 'Assignment Due Date',
    'assignment_points': 'Assignment Points',
    'submission': 'Submission',
    'submissions': 'Submissions',
    'submit_assignment': 'Submit Assignment',
    'upload_file': 'Upload File',
    'feedback': 'Feedback',
    'exam_title': 'Exam Title',
    'exam_duration': 'Exam Duration',
    'exam_pass_mark': 'Exam Pass Mark',
    'exam_questions': 'Exam Questions',
    'add_question': 'Add Question',
    'edit_question': 'Edit Question',
    'delete_question': 'Delete Question',
    'question_text': 'Question Text',
    'question_type': 'Question Type',
    'option': 'Option',
    'options': 'Options',
    'correct_answer': 'Correct Answer',
    'explanation': 'Explanation',
    'difficulty': 'Difficulty',
    'easy': 'Easy',
    'medium': 'Medium',
    'hard': 'Hard',
    'mcq': 'MCQ',
    'true_false': 'True/False',
    'fill_blank': 'Fill in the Blank',
    'short_answer': 'Short Answer',
    'essay': 'Essay',
    'numerical': 'Numerical',
    'past_questions': 'Past Questions',
    'jamb': 'JAMB',
    'waec': 'WAEC',
    'neco': 'NECO',
    'nabteb': 'NABTEB',
    'board': 'Board',
    'year': 'Year',
    'select_subject': 'Select Subject',
    'select_topic': 'Select Topic',
    'select_year': 'Select Year',
    'all_subjects': 'All Subjects',
    'all_topics': 'All Topics',
    'all_years': 'All Years',
    'practice': 'Practice',
    'timed': 'Timed',
    'mock': 'Mock',
    'full': 'Full',
    'ai_explanation': 'AI Explanation',
    'explain_like_im_five': 'Explain Like I\'m 5',
    'explain_like_im_ten': 'Explain Like I\'m 10',
    'ai_quiz': 'AI Quiz',
    'generate_quiz': 'Generate Quiz',
    'quiz_questions': 'Quiz Questions',
    'quiz_duration': 'Quiz Duration',
    'quiz_difficulty': 'Quiz Difficulty',
    'flashcard': 'Flashcard',
    'flashcards_title': 'Flashcards',
    'my_flashcards': 'My Flashcards',
    'course_flashcards': 'Course Flashcards',
    'ai_generated': 'AI Generated',
    'revise': 'Revise',
    'know_it': 'Know It',
    'getting_there': 'Getting There',
    'still_learning': 'Still Learning',
    'spaced_repetition': 'Spaced Repetition',
    'next_review': 'Next Review',
    'review_due': 'Review Due',
    'library_title': 'Library',
    'textbooks': 'Textbooks',
    'study_notes': 'Study Notes',
    'research_materials': 'Research Materials',
    'handouts': 'Handouts',
    'lecture_notes': 'Lecture Notes',
    'articles': 'Articles',
    'educational_videos': 'Educational Videos',
    'filter_by': 'Filter by',
    'all_levels': 'All Levels',
    'early_years': 'Early Years',
    'primary': 'Primary',
    'jss': 'JSS',
    'ss': 'SS',
    'tertiary': 'Tertiary',
    'professional': 'Professional',
    'adult': 'Adult',
    'vocational': 'Vocational',
    'p1': 'Primary 1',
    'p2': 'Primary 2',
    'p3': 'Primary 3',
    'p4': 'Primary 4',
    'p5': 'Primary 5',
    'p6': 'Primary 6',
    'jss1': 'JSS 1',
    'jss2': 'JSS 2',
    'jss3': 'JSS 3',
    'ss1': 'SS 1',
    'ss2': 'SS 2',
    'ss3': 'SS 3',
    'university': 'University',
    'polytechnic': 'Polytechnic',
    'college_of_education': 'College of Education',
    'certification': 'Certification',
    'career_training': 'Career Training',
    'settings_profile': 'Profile Settings',
    'settings_security': 'Security',
    'settings_notifications': 'Notification Settings',
    'settings_privacy': 'Privacy',
    'settings_about': 'About',
    'edit_profile': 'Edit Profile',
    'update_profile': 'Update Profile',
    'avatar': 'Avatar',
    'change_avatar': 'Change Avatar',
    'bio': 'Bio',
    'bio_placeholder': 'Tell us about yourself...',
    'save_changes': 'Save Changes',
    'cancel_changes': 'Cancel Changes',
    'logout_confirm': 'Are you sure you want to logout?',
    'delete_account': 'Delete Account',
    'delete_account_confirm': 'Are you sure you want to delete your account? This action cannot be undone.',
    'dark_mode': 'Dark Mode',
    'notifications_on': 'Notifications On',
    'notifications_off': 'Notifications Off',
    'sound': 'Sound',
    'vibrate': 'Vibrate',
    'app_version': 'App Version',
    'version': 'Version',
    'built_with': 'Built with Flutter',
    'copyright': 'Copyright',
    'all_rights_reserved': 'All rights reserved',
    'learn_more': 'Learn More',
    'back_to_home': 'Back to Home',
    'go_back': 'Go Back',
    'view_all': 'View All',
    'see_more': 'See More',
    'see_less': 'See Less',
    'no_internet': 'No Internet Connection',
    'check_connection': 'Please check your internet connection and try again.',
    'retry': 'Retry',
    'loading_data': 'Loading data...',
    'no_data_available': 'No data available',
    'no_data_found': 'No data found',
    'no_results_found': 'No results found',
    'empty_state': 'Nothing here yet',
    'empty_state_message': 'Check back later or try a different search.',
    'error_state': 'Something went wrong',
    'error_state_message': 'Please try again later.',
    'offline': 'Offline',
    'offline_message': 'You are currently offline. Some features may not be available.',
    'coming_soon': 'Coming Soon',
    'coming_soon_message': 'This feature is under development. Stay tuned!',
  };
}

class HaLocalizations {
  Map<String, String> get strings => const {
    'app_name': 'EduPlatform',
    'login': 'Shiga',
    'register': 'Rubuta',
    'email': 'Imel',
    'password': 'Kalmar motsi',
    'home': 'Gida',
    'courses': 'Lafiya',
    'exams': 'Boka',
    'profile': 'Siffa',
    'community': 'Al\'umma',
    'settings': 'Saituna',
    'save': 'Ajiye',
    'cancel': 'Soke',
    'delete': 'Fassara',
    'edit': 'Gyara',
    'next': 'Baya',
    'back': 'Komawa',
    'submit': 'Aika',
    'confirm': 'Tabbata',
    'loading': 'Yana lorawa...',
    'error': 'Kuskure',
    'success': 'Sabiya',
    'search': 'Bincike',
    'filter': 'Zaɓi',
    'sort': 'Tartara',
    'show_more': 'Nuna Ƙarin',
    'show_less': 'Nuna ƙuntata',
    'no_data': 'Babu bayani',
    'try_again': 'Gwada sau ɗaya',
    'ok': 'OK',
    'yes': 'Eh',
    'no': 'A’a',
    'close': 'Rufe',
    'continue': 'Ci gaba',
    'skip': 'Fada',
    'finish': 'Kammala',
    'start': 'Fara',
    'play': 'Wasa',
    'download': 'Sauke',
    'upload': 'Auka',
    'share': 'Raba',
    'refresh': 'Sabunta',
    'logout': 'Fita',
    'sign_in': 'Shiga',
    'sign_up': 'Rubuta suna',
    'forgot_password': 'Mun manta da kalmar sirri?',
    'reset_password': 'Sake saitin kalmar sirri',
    'change_password': 'Canza kalmar sirri',
    'current_password': 'Kalmar sirri ta yanzu',
    'new_password': 'Sabuwar kalmar sirri',
    'confirm_password': 'Tabbatar da kalmar sirri',
    'first_name': 'Suna farko',
    'last_name': 'Mazadar suna',
    'full_name': 'Cikakken suna',
    'phone_number': 'Lamba ta waya',
    'date_of_birth': 'Ranar haihuwa',
    'gender': 'Jinsi',
    'male': 'Namiji',
    'female': 'Mata',
    'other': 'Sauran',
    'student': 'Dalibi',
    'parent': 'Mai gado',
    'teacher': 'Malami',
    'school': 'Makami',
    'course': 'Lafiya',
    'lesson': 'Sako',
    'exam': 'Boka',
    'quiz': 'Bambance-bambance',
    'assignment': 'Aikaci',
    'subject': 'Saiɓi',
    'topic': 'Batu',
    'progress': 'Ci gaba',
    'results': 'Sakamako',
    'score': 'Maki',
    'grade': 'Mataki',
    'certificate': 'Takardar shaida',
    'notification': 'Sanarwa',
    'notifications': 'Sanarwa',
    'message': 'Saƙo',
    'messages': 'Saƙe',
    'settings_title': 'Saituna',
    'about': 'Game da',
    'help': 'Taimako',
    'privacy_policy': 'Dokar sirri',
    'terms_of_service': 'Sharuddan服务',
    'rate_us': 'Yi matakinmu',
    'share_app': 'Raba app',
    'language': 'Harshe',
    'theme': 'Dabara',
    'light': 'Haske',
    'dark': 'Duhu',
    'system': 'Tsarin',
    'notifications_title': 'Sanarwa',
    'enabled': 'An kunna',
    'disabled': 'An kashe',
    'on': 'A kan',
    'off': 'A ciki',
    'all': 'Duka',
    'read': 'Ireade',
    'unread': 'Ba a cika',
    'mark_as_read': 'Alamar karatu',
    'mark_as_unread': 'Alamar mara karatu',
    'delete_notification': 'Share sanarwa',
    'clear_all': 'Share duk',
    'no_notifications': 'Babu sanarwa',
    'your_progress': 'Ci gaban ka',
    'average_score': 'Maki na matsakaici',
    'study_time': 'Locin koyarwa',
    'lessons_completed': 'Sako sun kammala',
    'exams_taken': 'Boka aka dauka',
    'streak': 'Karya',
    'days': 'Yi',
    'weak_areas': 'Yankunan rauni',
    'strong_areas': 'Yankuna ƙarfi',
    'recommendations': 'Shawarwari',
    'study_now': 'Koyi yanzu',
    'continue_learning': 'Ci gaba da koyarwa',
    'start_exam': 'Fara boka',
    'view_results': 'Duba sakamako',
    'retake_exam': 'Sake boka',
    'pass': 'Wuce',
    'fail': 'Rashin nasara',
    'pending': 'Ya ke dogaro',
    'in_progress': 'Yana ci gaba',
    'completed': 'An kammala',
    'not_started': 'Ba a fara ba',
    'submitted': 'An aika',
    'graded': 'An mataki',
    'due': 'Yayin da',
    'overdue': 'Yayi tsawo',
    'time_remaining': 'Locin da ya rage',
    'time_up': 'Loce ya ƙare!',
    'question': 'Karuwa',
    'questions': 'Karuwa',
    'of': 'na',
    'previous': 'Na baya',
    'next_question': 'Baya',
    'submit_exam': 'Aika boka',
    'confirm_submit': 'Ka tabbatar cewa kuna son aika?',
    'no_results': 'Babu sakamako',
    'search_results': 'Sakamakon bincike',
    'no_courses': 'Babu lafiya',
    'no_lessons': 'Babu sako',
    'no_exams': 'Babu boka',
    'no_assignments': 'Babu aikaci',
    'no_notifications_home': 'Babu sanarwa',
    'network_error': 'Kuskuren netiwork. Da fatan za a duba haɗin kai.',
    'server_error': 'Kuskuren server. Da fatan za a gwada sau ɗaya.',
    'authentication_error': 'Ba a tabbatar da shi. Da fatan za a shiga sau ɗaya.',
    'session_expired': 'Zaman jima ya ƙare. Da fatan za a shiga sau ɗaya.',
    'something_went_wrong': 'Wani abin da ya karya. Da fatan za a gwada sau ɗaya.',
    'please_wait': 'Da fatan za a jira...',
    'process_your_request': 'Yana aiki da bukatar ku...',
    'upload_success': 'Auka ya yi nasara',
    'upload_failed': 'Auka ya kasa. Da fatan za a gwada sau ɗaya.',
    'download_success': 'Sauke ya yi nasara',
    'download_failed': 'Sauke ya kasa. Da fatan za a gwada sau ɗaya.',
    'deleted': 'An share da nasara',
    'deleted_failed': 'Share ya kasa. Da fatan za a gwada sau ɗaya.',
    'updated': 'An sabunta da nasara',
    'updated_failed': 'Sabunta ya kasa. Da fatan za a gwada sau ɗaya.',
    'created': 'An ƙirƙira da nasara',
    'created_failed': 'Ƙirƙira ya kasa. Da fatan za a gwada sau ɗaya.',
    'invalid_input': 'Ba a kwantar da shi ba. Da fatan za a duba rubutun ku.',
    'email_required': 'Imel yana buƙata',
    'invalid_email': 'Da fatan za a shigar da ingantaccen imel',
    'password_required': 'Kalmar sirri tana buƙata',
    'password_min_length': 'Kalmar sirri dole ne ta ƙunshi aƙalla haruffa 8',
    'passwords_not_match': 'Kalmar sirri ba ta dace ba',
    'name_required': 'Suna tana buƙata',
    'name_min_length': 'Suna dole ne ya ƙunshi aƙalla haruffa 2',
    'phone_required': 'Lamba ta waya tana buƙata',
    'otp_sent': 'OTP an aika zuwa imel ku',
    'otp_verified': 'OTP an tabbatar da shi',
    'otp_invalid': 'OTP ba ingantacce ba. Da fatan za a gwada sau ɗaya.',
    'verify_email_title': 'Tabbatar da Imel ku',
    'verify_email_message': 'Mun aika madaidaicin haɗin kai zuwa imel ku. Da fatan za a duba inbox.',
    'resend_otp': 'Sake aika OTP',
    'otp_sent_again': 'OTP an sake aika shi',
    'enter_otp': 'Shigar da OTP',
    'otp_placeholder': 'Shigar da OTP mai lambobi 6',
    'select_role': 'Zaɓi rawar ku',
    'role_student': 'Dalibi',
    'role_parent': 'Mai gado',
    'role_teacher': 'Malami',
    'welcome_back': 'Barka da komawa',
    'welcome': 'Barka',
    'get_started': 'Fara',
    'explore': 'Bincika',
    'learn': 'Koyi',
    'achieve': 'Samu',
    'ai_tutor': 'Malamin AI',
    'flashcards': 'Flashcards',
    'library': 'Librari',
    'gamification': 'Wasanni',
    'xp': 'XP',
    'points': 'Maki',
    'badges': 'Alamu',
    'achievements': 'Girma',
    'leaderboard': 'Nunin',
    'level': 'Mataki',
    'subscription': 'Aboneman',
    'subscriptions': 'Aboneman',
    'plans': 'Shirye-shiryen',
    'free': 'Kyauta',
    'premium': 'Premium',
    'basic': 'Gundumi',
    'subscribe': 'Yi aboneman',
    'subscribed': 'An yarda',
    'manage_subscription': 'Gudanar da aboneman',
    'cancel_subscription': 'Soke aboneman',
    'current_plan': 'Shirin yanzu',
    'expires': 'Yana ƙarewa',
    'renewal_date': 'Ranar sabunta',
    'payment_success': 'Biya ya yi nasara',
    'payment_failed': 'Biya ya kasa. Da fatan za a gwada sau ɗaya.',
    'payment_pending': 'Biya ya ke dogaro',
    'payment_history': 'Tarikhin biya',
    'invoice': 'Fatanin',
    'download_invoice': 'Sauke fatanin',
    'community_title': 'Al\'umma',
    'forums': 'Forums',
    'study_groups': 'Ƙungiyoyin koyarwa',
    'ask_question': 'Tambaya',
    'post': 'Bude',
    'posts': 'Bude',
    'comments': 'Kamantawa',
    'like': 'Son',
    'liked': 'An son',
    'reply': 'Amsa',
    'write_comment': 'Rubuta kamantawa...',
    'send': 'Aika',
    'group': 'Ƙungiya',
    'groups': 'Ƙungiyoyin',
    'join_group': 'Ƙunƙoji Ƙungiya',
    'leave_group': 'Barin Ƙungiya',
    'member': 'Masoya',
    'members': 'Masu',
    'create_group': 'Ƙirƙiri Ƙungiya',
    'group_name': 'Suna Ƙungiya',
    'group_description': 'Bayanin Ƙungiya',
    'parent_dashboard': 'Dashboard Mai Gado',
    'children': 'Yara',
    'add_child': 'Ƙara Yaro',
    'remove_child': 'Cire Yaro',
    'child_name': 'Suna Yaro',
    'child_progress': 'Ci gaban Yaro',
    'child_performance': 'Aikin Yaro',
    'child_study_time': 'Locin Koyarwa Yaro',
    'child_results': 'Sakamakon Yaro',
    'child_courses': 'Lafiya Yaro',
    'weak_subjects': 'Saiɓin Rauni',
    'strong_subjects': 'Saiɓin Ƙarfi',
    'teacher_dashboard': 'Dashboard Malami',
    'my_courses': 'Lafiya Na',
    'my_students': 'Dalibai Na',
    'my_assignments': 'Aikaci Na',
    'my_exams': 'Boka Na',
    'create_course': 'Ƙirƙiri Lafiya',
    'create_lesson': 'Ƙirƙiri Sako',
    'create_assignment': 'Ƙirƙiri Aikaci',
    'create_exam': 'Ƙirƙiri Boka',
    'course_title': 'Matan Lafiya',
    'course_description': 'Bayanin Lafiya',
    'course_duration': 'Locin Lafiya',
    'course_price': 'Farashin Lafiya',
    'course_level': 'Matakin Lafiya',
    'lesson_title': 'Matan Sako',
    'lesson_content': 'Abun ciki Sako',
    'lesson_video': 'Bidiyon Sako',
    'lesson_notes': 'Lu'ulu\'in Sako',
    'lesson_resources': 'Abubuwan Sako',
    'add_resource': 'Ƙara Abubuwa',
    'remove_resource': 'Cire Abubuwa',
    'resource_type': 'Nau\'in Abubuwa',
    'video': 'Bidiyo',
    'pdf': 'PDF',
    'image': 'Hoton',
    'document': 'Takarda',
    'note': 'Lu\'ulu\'i',
    'assignment_title': 'Matan Aikaci',
    'assignment_description': 'Bayanin Aikaci',
    'assignment_due_date': 'Ranar Aikaci',
    'assignment_points': 'Maki Aikaci',
    'submission': 'Aikaci',
    'submissions': 'Aikace-aikace',
    'submit_assignment': 'Aika Aikaci',
    'upload_file': 'Auka fayil',
    'feedback': 'Gargadi',
    'exam_title': 'Matan Boka',
    'exam_duration': 'Locin Boka',
    'exam_pass_mark': 'Matakin Boka',
    'exam_questions': 'Tambayoyin Boka',
    'add_question': 'Ƙara Tambaya',
    'edit_question': 'Gyara Tambaya',
    'delete_question': 'Share Tambaya',
    'question_text': 'Tambayar',
    'question_type': 'Nau\'in Tambaya',
    'option': 'Zaɓi',
    'options': 'Zaɓin',
    'correct_answer': 'Amsar daidai',
    'explanation': 'Bayani',
    'difficulty': 'Gogayya',
    'easy': 'Sauƙi',
    'medium': 'Matsakaici',
    'hard': 'Mai tsorari',
    'mcq': 'MCQ',
    'true_false': 'Gaskiya/E'ubalu',
    'fill_blank': 'Cika Blank',
    'short_answer': 'Amsa gajera',
    'essay': 'Essay',
    'numerical': 'Lambar',
    'past_questions': 'Tambayoyin Baya',
    'jamb': 'JAMB',
    'waec': 'WAEC',
    'neco': 'NECO',
    'nabteb': 'NABTEB',
    'board': 'Bodi',
    'year': 'Shekara',
    'select_subject': 'Zaɓi Saiɓi',
    'select_topic': 'Zaɓi Batu',
    'select_year': 'Zaɓi Shekara',
    'all_subjects': 'Duk Saiɓin',
    'all_topics': 'Duk Batutuwa',
    'all_years': 'Duk Shekara',
    'practice': 'Aroji',
    'timed': 'Wanda lokaci',
    'mock': 'Tsaye',
    'full': 'Cikakke',
    'ai_explanation': 'Bayanin AI',
    'explain_like_im_five': 'Bayyana kamar in 5',
    'explain_like_im_ten': 'Bayyana kamar in 10',
    'ai_quiz': 'Bambancen AI',
    'generate_quiz': 'Ƙirƙira Bambanci',
    'quiz_questions': 'Tambayoyin Bambanci',
    'quiz_duration': 'Locin Bambanci',
    'quiz_difficulty': 'Gogayyar Bambanci',
    'flashcard': 'Flashcard',
    'flashcards_title': 'Flashcards',
    'my_flashcards': 'Flashcards Na',
    'course_flashcards': 'Flashcards Lafiya',
    'ai_generated': 'An ƙirƙira ta AI',
    'revise': 'Gyara',
    'know_it': 'San shi',
    'getting_there': 'Yana zuwa',
    'still_learning': 'Har yanzu yana koyarwa',
    'spaced_repetition': 'Maimaitawa',
    'next_review': 'Bita na gaba',
    'review_due': 'Bita ya zo',
    'library_title': 'Librari',
    'textbooks': 'Litattafan makarantu',
    'study_notes': 'Lu\'ulu\'in Koyarwa',
    'research_materials': 'Abubuwan Bincike',
    'handouts': 'Handouts',
    'lecture_notes': 'Lu\'ulu\'in Jina',
    'articles': 'Artikulu',
    'educational_videos': 'Bidiyon Ilimi',
    'filter_by': 'Zaɓi ta',
    'all_levels': 'Duk Matakin',
    'early_years': 'Shekaru na farko',
    'primary': 'Farko',
    'jss': 'JSS',
    'ss': 'SS',
    'tertiary': 'Na uku',
    'professional': 'Masana\'antu',
    'adult': 'Girma',
    'vocational': 'Kwararru',
    'p1': 'Farko 1',
    'p2': 'Farko 2',
    'p3': 'Farko 3',
    'p4': 'Farko 4',
    'p5': 'Farko 5',
    'p6': 'Farko 6',
    'jss1': 'JSS 1',
    'jss2': 'JSS 2',
    'jss3': 'JSS 3',
    'ss1': 'SS 1',
    'ss2': 'SS 2',
    'ss3': 'SS 3',
    'university': 'Jami\'a',
    'polytechnic': 'Polytechnic',
    'college_of_education': 'Kolejin Ilimi',
    'certification': 'Takardar shaida',
    'career_training': ' horar da aikin',
    'settings_profile': 'Saitunan Siffa',
    'settings_security': 'Tsaro',
    'settings_notifications': 'Saitunan Sanarwa',
    'settings_privacy': 'Sirri',
    'settings_about': 'Game da',
    'edit_profile': 'Gyara Siffa',
    'update_profile': 'Sabunta Siffa',
    'avatar': 'Avatar',
    'change_avatar': 'Canza Avatar',
    'bio': 'Bio',
    'bio_placeholder': 'Fara game da kanka...',
    'save_changes': 'Ajiye canje-canje',
    'cancel_changes': 'Soke canje-canje',
    'logout_confirm': 'Ka tabbatar cewa kana son fita?',
    'delete_account': 'Share asusun',
    'delete_account_confirm': 'Ka tabbatar cewa kana son share asusun ka? Wannan aikin ba zai iya komawa ba.',
    'dark_mode': 'Yanayin Duhu',
    'notifications_on': 'Sanarwa na kan',
    'notifications_off': 'Sanarwa na ciki',
    'sound': 'Sauti',
    'vibrate': 'Ceton',
    'app_version': 'Girman App',
    'version': 'Girman',
    'built_with': 'An gina shi da Flutter',
    'copyright': 'Hoton',
    'all_rights_reserved': 'Duk haƙƙin an kiyaye',
    'learn_more': 'Koyi ƙarin',
    'back_to_home': 'Komawa Gida',
    'go_back': 'Komawa',
    'view_all': 'Duba Duk',
    'see_more': 'Duba Ƙarin',
    'see_less': 'Duba ƙuntata',
    'no_internet': 'Babu Haɗin Intanet',
    'check_connection': 'Da fatan za a duba haɗin intanet ku kuma a gwada sau ɗaya.',
    'retry': 'Sake Gwaji',
    'loading_data': 'Yana lorawa bayani...',
    'no_data_available': 'Babu bayani da ake samu',
    'no_data_found': 'Babu bayani da aka samu',
    'no_results_found': 'Babu sakamako da aka samu',
    'empty_state': 'Babu abin da yake nan nan',
    'empty_state_message': 'Duba komawa gaba ko a gwada wani bincike.',
    'error_state': 'Wani abin da ya karya',
    'error_state_message': 'Da fatan za a gwada sau ɗaya.',
    'offline': 'Ba kan layi ba',
    'offline_message': 'Kuna nan ba kan layi ba. Wasu fasaloli na iya zama ba a amfani da su ba.',
    'coming_soon': 'Yana zuwa da wuri',
    'coming_soon_message': 'Wannan fasalin yana ci gaba da ci gaba. Ya tsaya!',
  };
}

class YoLocalizations {
  Map<String, String> get strings => const {
    'app_name': 'EduPlatform',
    'login': 'Wọle',
    'register': 'Báṣẹ̀',
    'email': 'Imẹlì',
    'password': 'Ọ̀rọ̀ agbára',
    'home': 'Ilé',
    'courses': 'Awọn ẹ̀kọ́',
    'exams': 'Idánwọ́',
    'profile': 'Ẹ̀dọ̀kan',
    'community': 'Àjọ̀',
    'settings': 'Àwọn ìpèsè',
    'save': 'Tọ́jú',
    'cancel': 'Fagilé',
    'delete': 'Pa',
    'edit': 'Ìrọ̀rùn',
    'next': 'Tìí',
    'back': 'Padà',
    'submit': 'Fi ranṣẹ́',
    'confirm': 'Jẹ́rìí',
    'loading': 'Ní ń mú...',
    'error': 'Àìṣètò',
    'success': 'Àṣeyọrí',
    'search': 'Wá',
    'filter': 'Àlẹ́mọ́',
    'sort': 'Tẹ̀ lé',
    'show_more': 'Fi hàn púpọ̀',
    'show_less': 'Fi hàn díẹ̀',
    'no_data': 'Kò sí dátà',
    'try_again': 'Gbiyanu lẹ́ẹ̀kọ̀ọ́',
    'ok': 'BÁÉ',
    'yes': 'BÁÉ',
    'no': 'RÀÁ',
    'close': 'Pé',
    'continue': 'Tẹ̀síwájú',
    'skip': 'Kọjá',
    'finish': 'Parí',
    'start': 'Bẹ̀rẹ̀',
    'play': 'Já',
    'download': 'Gba sile',
    'upload': 'Gbe sókè',
    'share': 'Pín',
    'refresh': 'Tuntun',
    'logout': 'Yọ kúrò',
    'sign_in': 'Wọle',
    'sign_up': 'Báṣẹ̀',
    'forgot_password': 'Ṣe ògbó ọ̀rọ̀ agbára?',
    'reset_password': 'Tún ọ̀rọ̀ agbára设置',
    'change_password': 'Yí ọ̀rọ̀ agbára padà',
    'current_password': 'Ọ̀rọ̀ agbára lọ́wọ́',
    'new_password': 'Ọ̀rọ̀ agbára tuntun',
    'confirm_password': 'Jẹ́rìí ọ̀rọ̀ agbára',
    'first_name': 'Orúkọ àárín',
    'last_name': 'Orúkọ ìdílé',
    'full_name': 'Orúkọ kíkún',
    'phone_number': 'Nọ́mbà fọ́nù',
    'date_of_birth': 'Ọjọ́ìbí',
    'gender': 'Àwọ̀n ẹ̀yà',
    'male': 'Ọkùnrin',
    'female': 'Bíà Ọ̀dọ́bìnrin',
    'other': 'Òmíràn',
    'student': 'Akẹ́kọ̀ọ́',
    'parent': 'Òbí',
    'teacher': 'Olùkọ́',
    'school': 'Ilé-ẹ̀kọ́',
    'course': 'Ẹ̀kọ́',
    'lesson': 'Àwọn ìròyìn',
    'exam': 'Idánwọ́',
    'quiz': 'Ìbéèrè',
    'assignment': 'Ìṣètò',
    'subject': 'Àkọlé',
    'topic': 'Àkọsílẹ̀',
    'progress': 'Ìṣesí',
    'results': 'Èsì',
    'score': 'Amì',
    'grade': 'Ìwẹ̀',
    'certificate': 'Ìfọwọ́sí',
    'notification': 'Ìkìlọ̀',
    'notifications': 'Àwọn ìkìlọ̀',
    'message': 'Ìròyìn',
    'messages': 'Àwọn ìròyìn',
    'settings_title': 'Àwọn ìpèsè',
    'about': 'Nípa',
    'help': 'Ìrànlọ́wọ́',
    'privacy_policy': ' Ìlànà ìpamọ́',
    'terms_of_service': 'Àwọn òfin iṣẹ́',
    'rate_us': 'Ṣe ìwòye wa',
    'share_app': 'Pín app',
    'language': 'Èdè',
    'theme': 'Àwòrán',
    'light': 'Mímọ́',
    'dark': 'Àlùbàrdá',
    'system': 'Ẹ̀gàn',
    'notifications_title': 'Àwọn ìkìlọ̀',
    'enabled': 'Tí a ṣe',
    'disabled': 'Tí a pa',
    'on': 'Lórí',
    'off': 'Kúrò',
    'all': 'Gbogbo',
    'read': 'Kà',
    'unread': 'Kò kà',
    'mark_as_read': 'Ṣe àmì gẹ́gẹ́ bí a ti kà',
    'mark_as_unread': 'Ṣe àmì gẹ́gẹ́ bí a kò tíì kà',
    'delete_notification': 'Pa ìkìlọ̀',
    'clear_all': 'Fẹ̀sẹ̀̀mọ̀ gbogbo',
    'no_notifications': 'Kò sí ìkìlọ̀',
    'your_progress': 'Ìṣesí rẹ',
    'average_score': 'Amì àdámẹ́ta',
    'study_time': 'Àkókò ìwé',
    'lessons_completed': 'Àwọn ìròyìn tí a parí',
    'exams_taken': 'Àwọn idánwọ́ tí a gba',
    'streak': 'Ìtẹ̀síwájú',
    'days': 'Ọjọ́',
    'weak_areas': 'Àwọn agbègbè òfin',
    'strong_areas': 'Àwọn agbègbè lágbára',
    'recommendations': 'Àwọn ìmọ̀ràn',
    'study_now': 'Kọ́ ní báyìí',
    'continue_learning': 'Tẹ̀síwájú ìwé',
    'start_exam': 'Bẹ̀rẹ̀ idánwọ́',
    'view_results': 'Ṣe àfihàn èsì',
    'retake_exam': 'Gba idánwọ́ lẹ́ẹ̀kọ̀ọ́',
    'pass': 'Kọjá',
    'fail': 'Kò kọjá',
    'pending': 'Dúró',
    'in_progress': 'Ní ń lọ',
    'completed': 'Parí',
    'not_started': 'Kò tíì bẹ̀rẹ̀',
    'submitted': 'Ti a fi ranṣẹ́',
    'graded': 'Ti a ṣe ìwẹ̀',
    'due': 'Ti ó yẹ',
    'overdue': 'Pẹ́ tú',
    'time_remaining': 'Àkókò tí ó kù',
    'time_up': 'Àkókò parí!',
    'question': 'Ìbéèrè',
    'questions': 'Àwọn ìbéèrè',
    'of': 'ti',
    'previous': 'Tẹ́lẹ̀',
    'next_question': 'Ọ̀tún',
    'submit_exam': 'Fi idánwọ́ ranṣẹ́',
    'confirm_submit': 'Ṣe o ṣe é ṣe láti fi idánwọ́ ranṣẹ́?',
    'no_results': 'Kò sí èsì',
    'search_results': 'Àwọn èsì ìwá',
    'no_courses': 'Kò sí ẹ̀kọ́',
    'no_lessons': 'Kò sí ìròyìn',
    'no_exams': 'Kò sí idánwọ́',
    'no_assignments': 'Kò sí ìṣètò',
    'no_notifications_home': 'Kò sí ìkìlọ̀',
    'network_error': 'Àìṣètò nẹ́tíwọ́ọ̀kì. Jọ̀wọ́ ṣàyẹ̀wò ìbáṣepọ́ rẹ.',
    'server_error': 'Àìṣètò ẹ̀rọ aláìlẹ́. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kọ̀ọ́.',
    'authentication_error': 'Kò ṣe é ṣe ìdánwò. Jọ̀wọ́ wọle lẹ́ẹ̀kọ̀ọ́.',
    'session_expired': 'Àkókò parí. Jọ̀wọ́ wọle lẹ́ẹ̀kọ̀ọ́.',
    'something_went_wrong': 'Ohun kan ti buru. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kọ̀ọ́.',
    'please_wait': 'Jọ̀wọ́ dúró...',
    'process_your_request': 'Ní ń ṣiṣẹ́ lórí ibeere rẹ...',
    'upload_success': 'Gbe sókè ṣiṣẹ́',
    'upload_failed': 'Gbe sókè kọ̀. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kọ̀ọ́.',
    'download_success': 'Gba sile ṣiṣẹ́',
    'download_failed': 'Gba sile kọ̀. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kọ̀ọ́.',
    'deleted': 'Pa ṣiṣẹ́',
    'deleted_failed': 'Pa kọ̀. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kọ̀ọ́.',
    'updated': 'Ṣe untun ṣiṣẹ́',
    'updated_failed': 'Ṣe untun kọ̀. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kọ̀ọ́.',
    'created': 'Ṣe ẹ̀dá ṣiṣẹ́',
    'created_failed': 'Ṣe ẹ̀dá kọ̀. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kọ̀ọ́.',
    'invalid_input': 'Ìtọ́sọ́nà kò tọ́. Jọ̀wọ́ ṣàyẹ̀wò àwọn nǹkan rẹ.',
    'email_required': 'Imẹlì gbọ́dọ̀ wà',
    'invalid_email': 'Jọ̀wọ́ tẹ́ imẹlì tọ́ sílẹ̀',
    'password_required': 'Ọ̀rọ̀ agbára gbọ́dọ̀ wà',
    'password_min_length': 'Ọ̀rọ̀ agbára gbọ́dọ̀ ní àìkákà 8',
    'passwords_not_match': 'Àwọn ọ̀rọ̀ agbára kò bára',
    'name_required': 'Orúkọ gbọ́dọ̀ wà',
    'name_min_length': 'Orúkọ gbọ́dọ̀ ní àìkákà 2',
    'phone_required': 'Nọ́mbà fọ́nù gbọ́dọ̀ wà',
    'otp_sent': 'OTP ti a rán sí imẹlì rẹ',
    'otp_verified': 'OTP ti a ṣe ìdánwò',
    'otp_invalid': 'OTP kò tọ́. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kọ̀ọ́.',
    'verify_email_title': 'Ṣe ìdánwò Imẹlì rẹ',
    'verify_email_message': 'A ti rán ìbáṣepọ́ ìdánwò sí imẹlì rẹ. Jọ̀wọ́ ṣàyẹ̀wò inbox rẹ.',
    'resend_otp': 'Rán OTP lẹ́ẹ̀kọ̀ọ́',
    'otp_sent_again': 'OTP ti a rán lẹ́ẹ̀kọ̀ọ́',
    'enter_otp': 'Tẹ́ OTP sínú',
    'otp_placeholder': 'Tẹ́ OTP oníṣòro 6',
    'select_role': 'Yan ipa rẹ',
    'role_student': 'Akẹ́kọ̀ọ́',
    'role_parent': 'Òbí',
    'role_teacher': 'Olùkọ́',
    'welcome_back': 'Àbáwòlé padà',
    'welcome': 'Àbáwòlé',
    'get_started': 'Bẹ̀rẹ̀',
    'explore': 'Wá àwọn nǹkan',
    'learn': 'Kọ́',
    'achieve': 'Ṣe àṣeyọrí',
    'ai_tutor': 'Olùkọ́ AI',
    'flashcards': 'Àwọn ìwé flash',
    'library': 'Ibi ìwé',
    'gamification': 'Gaming',
    'xp': 'XP',
    'points': 'Amì',
    'badges': 'Àwọn amì',
    'achievements': 'Àwọn àṣeyọrí',
    'leaderboard': 'Àwọn olùdarí',
    'level': 'Ìpele',
    'subscription': 'Ìbàṣepọ́',
    'subscriptions': 'Àwọn ìbàṣepọ́',
    'plans': 'Àwọn ètò',
    'free': 'Freesi',
    'premium': 'Premium',
    'basic': 'Àkọ́kọ́',
    'subscribe': 'Ṣe ìbàṣepọ́',
    'subscribed': 'A ti ṣe ìbàṣepọ́',
    'manage_subscription': 'Ṣàkóso ìbàṣepọ́',
    'cancel_subscription': 'Fagilé ìbàṣepọ́',
    'current_plan': 'Ètò lọ́wọ́',
    'expires': 'Parí',
    'renewal_date': 'Ọjọ́ untun',
    'payment_success': 'Ìsanwó ṣiṣẹ́',
    'payment_failed': 'Ìsanwó kọ̀. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kọ̀ọ́.',
    'payment_pending': 'Ìsanwó dúró',
    'payment_history': 'Ìtàn ìsanwó',
    'invoice': 'Ìwé ìsànwó',
    'download_invoice': 'Gba ìwé ìsànwó sile',
    'community_title': 'Àjọ',
    'forums': 'Àwọn fọ́rọ̀ọ̀',
    'study_groups': 'Àwọn ẹgbẹ́ ìwé',
    'ask_question': 'Bẹ̀rẹ̀ ìbéèrè',
    'post': 'Òpò',
    'posts': 'Àwọn òpò',
    'comments': 'Àwọn ìròyìn',
    'like': 'Fẹ̀rẹ̀',
    'liked': 'A fẹ̀rẹ̀',
    'reply': 'Dáhùn',
    'write_comment': 'Kọ ẹ̀sìn...',
    'send': 'Rán',
    'group': 'Ẹgbẹ́',
    'groups': 'Àwọn ẹgbẹ́',
    'join_group': 'Darapò mọ́ ẹgbẹ́',
    'leave_group': 'Kúrò nínú ẹgbẹ́',
    'member': 'Ẹ̀gbẹ́',
    'members': 'Àwọn ẹ̀gbẹ́',
    'create_group': 'Ṣẹ́dá ẹgbẹ́',
    'group_name': 'Orúkọ ẹgbẹ́',
    'group_description': 'Àlàyé ẹgbẹ́',
    'parent_dashboard': 'Pálátípu Òbí',
    'children': 'Àwọn ọmọ',
    'add_child': 'Fikú ọmọ',
    'remove_child': 'Yọ ọmọ kúrò',
    'child_name': 'Orúkọ ọmọ',
    'child_progress': 'Ìṣesí ọmọ',
    'child_performance': 'Iṣẹ́ ọmọ',
    'child_study_time': 'Àkókò ìwé ọmọ',
    'child_results': 'Èsì ọmọ',
    'child_courses': 'Àwọn ẹ̀kọ́ ọmọ',
    'weak_subjects': 'Àwọn àkọlé òfin',
    'strong_subjects': 'Àwọn àkọlé lágbára',
    'teacher_dashboard': 'Pálátípu Olùkọ́',
    'my_courses': 'Àwọn ẹ̀kọ́ mi',
    'my_students': 'Àwọn akẹ́kọ̀ọ́ mi',
    'my_assignments': 'Àwọn ìṣètò mi',
    'my_exams': 'Àwọn idánwọ́ mi',
    'create_course': 'Ṣẹ́dá ẹ̀kọ́',
    'create_lesson': 'Ṣẹ́dá ìròyìn',
    'create_assignment': 'Ṣẹ́dá ìṣètò',
    'create_exam': 'Ṣẹ́dá idánwọ́',
    'course_title': 'Àkọlé ẹ̀kọ́',
    'course_description': 'Àlàyé ẹ̀kọ́',
    'course_duration': 'Gígùn ẹ̀kọ́',
    'course_price': 'Ọ̀pọ̀ ẹ̀kọ́',
    'course_level': 'Ìpele ẹ̀kọ́',
    'lesson_title': 'Àkọlé ìròyìn',
    'lesson_content': 'Ohun ìròyìn',
    'lesson_video': 'Fídíò ìròyìn',
    'lesson_notes': 'Àwọn ìkíyè sí',
    'lesson_resources': 'Àwọn ohun èlò ìròyìn',
    'add_resource': 'Fikú ohun èlò',
    'remove_resource': 'Yọ ohun èlò kúrò',
    'resource_type': 'Irú ohun èlò',
    'video': 'Fídíò',
    'pdf': 'PDF',
    'image': 'Àwòrán',
    'document': 'Dókímẹ́ntì',
    'note': 'Ìkíyè sí',
    'assignment_title': 'Àkọlé ìṣètò',
    'assignment_description': 'Àlàyé ìṣètò',
    'assignment_due_date': 'Ọjọ́ ìṣètò',
    'assignment_points': 'Amì ìṣètò',
    'submission': 'Ìfiwé',
    'submissions': 'Àwọn ìfiwé',
    'submit_assignment': 'Fi ìṣètò ranṣẹ́',
    'upload_file': 'Gbe fáìlì sókè',
    'feedback': 'Àfikún',
    'exam_title': 'Àkọlé idánwọ́',
    'exam_duration': 'Gígùn idánwọ́',
    'exam_pass_mark': 'Amì kíkọjá idánwọ́',
    'exam_questions': 'Àwọn ìbéèrè idánwọ́',
    'add_question': 'Fikú ìbéèrè',
    'edit_question': 'Ṣe ìròrùn ìbéèrè',
    'delete_question': 'Pa ìbéèrè',
    'question_text': 'Ìbéèrè',
    'question_type': 'Irú ìbéèrè',
    'option': 'Àṣàyàn',
    'options': 'Àwọn àṣàyàn',
    'correct_answer': 'Ìdáhùn tọ́',
    'explanation': 'Àlàyé',
    'difficulty': 'Ìṣẹ̀ìṣòro',
    'easy': 'Rírọ̀',
    'medium': 'Àárín',
    'hard': 'Lára',
    'mcq': 'MCQ',
    'true_false': 'Òtítọ́/Tà',
    'fill_blank': 'Kún ìfura',
    'short_answer': 'Ìdáhùn kúkúrú',
    'essay': 'Èssè',
    'numerical': 'Númírọ́lọ́jì',
    'past_questions': 'Àwọn ìbéèrè ìṣáájú',
    'jamb': 'JAMB',
    'waec': 'WAEC',
    'neco': 'NECO',
    'nabteb': 'NABTEB',
    'board': 'Bọ́ọ̀dù',
    'year': 'Ọdún',
    'select_subject': 'Yan àkọlé',
    'select_topic': 'Yan àkọsílẹ̀',
    'select_year': 'Yan ọdún',
    'all_subjects': 'Gbogbo àkọlé',
    'all_topics': 'Gbogbo àkọsílẹ̀',
    'all_years': 'Gbogbo ọdún',
    'practice': 'Ìṣerà',
    'timed': 'Ìdánwọ́ ìṣẹ́jú',
    'mock': 'Ìdánwọ́ ìtẹ́wọ́gbà',
    'full': 'Kíkún',
    'ai_explanation': 'Àlàyé AI',
    'explain_like_im_five': 'Ṣàlàyé gẹ́gẹ́ bí ẹni 5',
    'explain_like_im_ten': 'Ṣàlàyé gẹ́gẹ́ bí ẹni 10',
    'ai_quiz': 'Ìbéèrè AI',
    'generate_quiz': 'Ṣẹ́dá ìbéèrè',
    'quiz_questions': 'Àwọn ìbéèrè ìbéèrè',
    'quiz_duration': 'Gígùn ìbéèrè',
    'quiz_difficulty': 'Ìṣẹ̀ìṣòro ìbéèrè',
    'flashcard': 'Àwòrán flash',
    'flashcards_title': 'Àwọn ìwé flash',
    'my_flashcards': 'Àwọn ìwé flash mi',
    'course_flashcards': 'Àwọn ìwé flash ẹ̀kọ́',
    'ai_generated': 'A ṣẹ́dá AI',
    'revise': 'Ṣe ìtúnṣe',
    'know_it': 'Mọ́',
    'getting_there': 'Níròsí',
    'still_learning': 'Ṣi ń kọ́',
    'spaced_repetition': 'Àtúnṣe àìkákà',
    'next_review': 'Àtúnṣe tó ń bọ̀',
    'review_due': 'Àtúnṣe wà',
    'library_title': 'Ibi ìwé',
    'textbooks': 'Àwọn ìwé ìkọ́',
    'study_notes': 'Àwọn ìkíyè sí ìwé',
    'research_materials': 'Àwọn ohun èlò ìwádìí',
    'handouts': 'Àwọn ìwé ìkásí',
    'lecture_notes': 'Àwọn ìkíyè sí ìtẹ̀wé',
    'articles': 'Àwọn ìkàwé',
    'educational_videos': 'Àwọn fídíò ìmọ̀',
    'filter_by': 'Àlẹ́mọ́ ní',
    'all_levels': 'Gbogbo ìpele',
    'early_years': 'Ọdún ìbẹ̀rẹ̀',
    'primary': 'Àkọ́kọ́',
    'jss': 'JSS',
    'ss': 'SS',
    'tertiary': 'Kẹ́ta',
    'professional': 'Oníṣẹ́ ọjọ́gbọ́',
    'adult': 'Ọdún',
    'vocational': 'Oníṣẹ́ ọjọ́gbọ́',
    'p1': 'Àkọ́kọ́ 1',
    'p2': 'Àkọ́kọ́ 2',
    'p3': 'Àkọ́kọ́ 3',
    'p4': 'Àkọ́kọ́ 4',
    'p5': 'Àkọ́kọ́ 5',
    'p6': 'Àkọ́kọ́ 6',
    'jss1': 'JSS 1',
    'jss2': 'JSS 2',
    'jss3': 'JSS 3',
    'ss1': 'SS 1',
    'ss2': 'SS 2',
    'ss3': 'SS 3',
    'university': 'Ìwé-èkọ́ gíga',
    'polytechnic': 'Polítẹ̀kníkì',
    'college_of_education': 'Kọ̀lẹ́jì ìmọ̀',
    'certification': 'Ìfọwọ́sí',
    'career_training': 'Ìtọ́ni ìṣẹ́',
    'settings_profile': 'Àwọn ìpèsè Ẹ̀dọ̀kan',
    'settings_security': 'Àbò',
    'settings_notifications': 'Àwọn ìpèsè ìkìlọ̀',
    'settings_privacy': 'Ìpamọ́',
    'settings_about': 'Nípa',
    'edit_profile': 'Ṣe ìròrùn Ẹ̀dọ̀kan',
    'update_profile': 'Ṣe untun Ẹ̀dọ̀kan',
    'avatar': 'Àwòrán',
    'change_avatar': 'Yí àwòrán padà',
    'bio': 'Bíò',
    'bio_placeholder': 'Sọ̀rọ̀ nípa ara rẹ...',
    'save_changes': 'Tọ́jú àwọn ìyípadà',
    'cancel_changes': 'Fagilé àwọn ìyípadà',
    'logout_confirm': 'Ṣe o dá a dúró láti yọ kúrò?',
    'delete_account': 'Pa àkántì',
    'delete_account_confirm': 'Ṣe o dá a dúró láti pa àkántì rẹ? Kò ṣe é ṣe láti padà.',
    'dark_mode': 'Ẹ̀dọ̀kan dúdú',
    'notifications_on': 'Àwọn ìkìlọ̀ wà',
    'notifications_off': 'Àwọn ìkìlọ̀ kúrò',
    'sound': 'Orin',
    'vibrate': 'Gbigbé',
    'app_version': 'Ọ̀wọ́n app',
    'version': 'Ọ̀wọ́n',
    'built_with': 'A kọ́ pẹ̀lú Flutter',
    'copyright': 'Copyright',
    'all_rights_reserved': 'Gbogbo ẹtò ti a pádánù',
    'learn_more': 'Kọ́ sí i',
    'back_to_home': 'Padà sí ilé',
    'go_back': 'Padà',
    'view_all': 'Ṣe àfihàn gbogbo',
    'see_more': 'Rí sí i',
    'see_less': 'Rí díẹ̀',
    'no_internet': 'Kò sí intanẹ́ẹ̀tì',
    'check_connection': 'Jọ̀wọ́ ṣàyẹ̀wò ìbáṣepọ́ intanẹ́ẹ̀tì rẹ kí o tó gbìyànjú lẹ́ẹ̀kọ̀ọ́.',
    'retry': 'Gbìyànjú lẹ́ẹ̀kọ̀ọ́',
    'loading_data': 'Ní ń mú dátà...',
    'no_data_available': 'Kò sí dátà tí a le rànlọ́wọ́',
    'no_data_found': 'Kò sí dátà tí a rí',
    'no_results_found': 'Kò sí èsì tí a rí',
    'empty_state': 'Kò sí nǹkan níbìí',
    'empty_state_message': 'Ṣàyẹ̀wò lẹ́ẹ̀kọ̀ọ́ tàbí gbìyànjú ìwá mìíràn.',
    'error_state': 'Ohun kan ti buru',
    'error_state_message': 'Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kọ̀ọ́.',
    'offline': 'Kò sí nǹkan',
    'offline_message': 'O wà ní òkè. Àwọn ìrìn-àjò díẹ̀ kò le nípa.',
    'coming_soon': 'Ó ń bọ̀',
    'coming_soon_message': 'Ìrìn-àjò yìí ń lọ síwájú. Dúró!',
  };
}
