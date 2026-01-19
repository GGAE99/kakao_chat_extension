import { KakaoClient } from './kakaoClient';

// Template Types
export interface TextTemplate {
  object_type: 'text';
  text: string;
  link: {
    web_url?: string;
    mobile_web_url?: string;
  };
  button_title?: string;
}

export interface FeedContent {
  title: string;
  description: string;
  image_url?: string;
  image_width?: number;
  image_height?: number;
  link: {
    web_url?: string;
    mobile_web_url?: string;
  };
}

export interface FeedButton {
  title: string;
  link: {
    web_url?: string;
    mobile_web_url?: string;
  };
}

export interface FeedTemplate {
  object_type: 'feed';
  content: FeedContent;
  buttons?: FeedButton[];
}

export type MessageTemplate = TextTemplate | FeedTemplate;

// API Response Types
interface SendMessageResponse {
  result_code: number;
}

interface SendToFriendsResponse {
  successful_receiver_uuids?: string[];
  failure_info?: Array<{
    code: number;
    msg: string;
    receiver_uuids: string[];
  }>;
}

export class MessageApi {
  constructor(private client: KakaoClient) {}

  /**
   * Send a message to yourself using the default template
   */
  public async sendToMe(template: MessageTemplate): Promise<void> {
    const templateJson = JSON.stringify(template);

    await this.client.post<SendMessageResponse>(
      '/v2/api/talk/memo/default/send',
      `template_object=${encodeURIComponent(templateJson)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
  }

  /**
   * Send a text message to yourself
   */
  public async sendTextToMe(text: string, linkUrl?: string): Promise<void> {
    const template: TextTemplate = {
      object_type: 'text',
      text: text,
      link: {
        web_url: linkUrl || 'https://developers.kakao.com',
        mobile_web_url: linkUrl || 'https://developers.kakao.com',
      },
    };

    await this.sendToMe(template);
  }

  /**
   * Send a feed message to yourself
   */
  public async sendFeedToMe(
    title: string,
    description: string,
    imageUrl?: string,
    linkUrl?: string
  ): Promise<void> {
    const template: FeedTemplate = {
      object_type: 'feed',
      content: {
        title: title,
        description: description,
        image_url: imageUrl,
        link: {
          web_url: linkUrl,
          mobile_web_url: linkUrl,
        },
      },
    };

    await this.sendToMe(template);
  }

  /**
   * Send a message to friends (requires friends API permission)
   * Maximum 5 friends at a time
   */
  public async sendToFriends(
    receiverUuids: string[],
    template: MessageTemplate
  ): Promise<SendToFriendsResponse> {
    if (receiverUuids.length === 0) {
      throw new Error('At least one receiver is required');
    }

    if (receiverUuids.length > 5) {
      throw new Error('Cannot send to more than 5 friends at once');
    }

    const templateJson = JSON.stringify(template);
    const uuidsJson = JSON.stringify(receiverUuids);

    const response = await this.client.post<SendToFriendsResponse>(
      '/v1/api/talk/friends/message/default/send',
      `receiver_uuids=${encodeURIComponent(uuidsJson)}&template_object=${encodeURIComponent(templateJson)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response;
  }
}
