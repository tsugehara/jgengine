module jgengine {
	export interface EventSerializer {
		serializer: Serializer;
		serialize(buffer: ArrayBuffer, offset:number, event:SerializableEvent):number;
		size(event:SerializableEvent):number;
	}
	export interface EventDeserializer {
		serializer: Serializer;
		deserialize(buffer: ArrayBuffer, offset:number, out:UpdateLog):number;
	}
	export interface SerializableEvent {
		type: number;
		action: number;
	}
	export interface UpdateLog {
		type:number;
		t:number;
		events:SerializableEvent[];
	}

	export interface DeserializedData {
		seek: number;
		data: UpdateLog[];
	}

	//base serializer
	export class Serializer {
		event_serializers: {[key:number]: EventSerializer;};
		event_deserializers: {[key:number]: EventDeserializer;};

		constructor() {
			this.event_serializers = {};
			this.event_deserializers = {};
		}

		serialize(log:UpdateLog):any {
			throw "not implemented";
		}

		deserialize(data:any):UpdateLog {
			throw "not implemented";
		}

		serializeAll(logs:UpdateLog[]):ArrayBuffer {
			throw "not implemented";
		}

		deserializeAll(data:ArrayBuffer):DeserializedData {
			throw "not implemented";
		}
	}
}