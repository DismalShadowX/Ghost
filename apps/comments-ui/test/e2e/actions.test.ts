import {MockedApi, initialize, waitEditorFocused} from '../utils/e2e';
import {expect, test} from '@playwright/test';

test.describe('Actions', async () => {
    test('Can like and unlike a comment', async ({page}) => {
        const mockedApi = new MockedApi({});
        mockedApi.setMember({});

        mockedApi.addComment({
            html: '<p>This is comment 1</p>'
        });
        mockedApi.addComment({
            html: '<p>This is comment 2</p>',
            liked: true,
            count: {
                likes: 52
            }
        });
        mockedApi.addComment({
            html: '<p>This is comment 3</p>'
        });

        const {frame} = await initialize({
            mockedApi,
            page,
            publication: 'Publisher Weekly'
        });

        // Check like button is not filled yet
        const comment = frame.getByTestId('comment-component').nth(0);
        const likeButton = comment.getByTestId('like-button');
        await expect(likeButton).toHaveCount(1);

        const icon = likeButton.locator('svg');
        await expect(icon).not.toHaveClass(/fill/);
        await expect(likeButton).toHaveText('0');

        // Click button
        await likeButton.click();

        // Check not filled
        await expect(icon).toHaveClass(/fill/);
        await expect(likeButton).toHaveText('1');

        // Click button again
        await likeButton.click();

        await expect(icon).not.toHaveClass(/fill/);
        await expect(likeButton).toHaveText('0');

        // Check state for already liked comment
        const secondComment = frame.getByTestId('comment-component').nth(1);
        const likeButton2 = secondComment.getByTestId('like-button');
        await expect(likeButton2).toHaveCount(1);
        const icon2 = likeButton2.locator('svg');
        await expect(icon2).toHaveClass(/fill/);
        await expect(likeButton2).toHaveText('52');
    });

    test('Can reply to a comment', async ({page}) => {
        const mockedApi = new MockedApi({});
        mockedApi.setMember({});

        mockedApi.addComment({
            html: '<p>This is comment 1</p>'
        });
        mockedApi.addComment({
            html: '<p>This is comment 2</p>',
            liked: true,
            count: {
                likes: 52
            }
        });
        mockedApi.addComment({
            html: '<p>This is comment 3</p>'
        });

        const {frame} = await initialize({
            mockedApi,
            page,
            publication: 'Publisher Weekly'
        });

        // Check like button is not filled yet
        const comment = frame.getByTestId('comment-component').nth(0);
        const replyButton = comment.getByTestId('reply-button');
        await expect(replyButton).toHaveCount(1);

        // Click button
        await replyButton.click();
        const editor = frame.getByTestId('form-editor');
        await expect(editor).toBeVisible();
        // Wait for focused
        await waitEditorFocused(editor);

        // Type some text
        await page.keyboard.type('This is a reply 123');
        await expect(editor).toHaveText('This is a reply 123');

        // Click reply button
        const submitButton = comment.getByTestId('submit-form-button');
        await submitButton.click();

        // Check total amount of comments increased
        await expect(frame.getByTestId('comment-component')).toHaveCount(4);
        await expect(frame.getByText('This is a reply 123')).toHaveCount(1);
    });

    test('Can add expertise', async ({page}) => {
        const mockedApi = new MockedApi({});
        mockedApi.setMember({name: 'John Doe', expertise: null});

        mockedApi.addComment({
            html: '<p>This is comment 1</p>'
        });

        const {frame} = await initialize({
            mockedApi,
            page,
            publication: 'Publisher Weekly'
        });

        const editor = frame.getByTestId('form-editor');
        await editor.click({force: true});
        await waitEditorFocused(editor);

        const expertiseButton = frame.getByTestId('expertise-button');
        await expect(expertiseButton).toBeVisible();
        await expect(expertiseButton).toHaveText('·Add your expertise');
        await expertiseButton.click();

        const detailsFrame = page.frameLocator('iframe[title="addDetailsPopup"]');
        const profileModal = detailsFrame.getByTestId('profile-modal');
        await expect(profileModal).toBeVisible();

        await expect(detailsFrame.getByTestId('name-input')).toHaveValue('John Doe');
        await expect(detailsFrame.getByTestId('expertise-input')).toHaveValue('');

        await detailsFrame.getByTestId('name-input').fill('Testy McTest');
        await detailsFrame.getByTestId('expertise-input').fill('Software development');

        await detailsFrame.getByTestId('save-button').click();

        await expect(profileModal).not.toBeVisible();

        await expect(frame.getByTestId('member-name')).toHaveText('Testy McTest');
        await expect(frame.getByTestId('expertise-button')).toHaveText('·Software development');
    });
});

